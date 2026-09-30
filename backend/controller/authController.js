const express = require("express");
const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const User_Log = db.User_Logs;
const User_Details = db.User_Details;
//const sub_master = db.sub_master;
const AppError = require("../utils/appError");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/sendmail");
const jwt = require("jsonwebtoken");
const { generateToken, verifyToken } = require("../utils/jwtToken");
const redisClient = require("../config/redis");
const {
  formatToIST,
  getCurrentISTDateTime,
  getClientIP,
} = require("../utils/formatDateTime");

const registerUser = asyncHandler(async (req, res) => {
  const { User_Name, Email_Id, Role } = req.body;
  if (!User_Name || !Email_Id || !Role) {
    res.status(400);
    throw new AppError("Please provide User_Name, Email_Id and Role", 400);
  }

  const existingUser = await User_Details.findOne({
    where: { Email_Id: Email_Id.trim() },
  });
  if (existingUser) {
    res.status(400);
    throw new AppError("User already exists with this Email_Id", 400);
  }

  const generatePasword = Math.random()
    .toString(36)
    .slice(-8)
    .toString()
    .toUpperCase();

  await User_Details.create({
    User_Name: User_Name.trim(),
    Email_Id: Email_Id.trim(),
    Role: Role.toString(),
    Password: await bcrypt.hash(generatePasword, bcrypt.genSaltSync(10)),
    Temp_Password: generatePasword,
    ResetPass: 'N',
    token_version: 0,
  });

  res.status(201).json({ message: "User registered successfully", user: Role });
});

const loginUser = asyncHandler(async (req, res) => {
  const clientIP = getClientIP(req);
  const { user_id, password } = req.body;

  const trimmedUserId = user_id?.trim();
  const trimmedPassword = password?.trim();

  if (!trimmedUserId || !trimmedPassword) {
    throw new AppError("User ID and password are required", 401);
  }

  const user_exists = await User_Details.findOne({
    where: { User_Id: trimmedUserId },
  });

  console.log(user_exists);

  if (!user_exists) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user_exists.activestatus && user_exists.activestatus !== 'Active') {
    throw new AppError("Account is inactive. Please contact administrator.", 403);
  }

  // ResetPass = 'N' → first-time / needs reset (Temp_Password plain text, no Password set yet)
  // ResetPass = 'Y' → normal login (Password bcrypt hash)
  //                    BUT if the user enters their Temp_Password, also redirect to reset-password
  const needsReset = user_exists.ResetPass === 'N';

  let isPasswordValid = false;
  let usedTempPassword = false;

  if (needsReset) {
    // Only Temp_Password is valid at this stage (plain text)
    isPasswordValid = trimmedPassword === user_exists.Temp_Password;
    usedTempPassword = isPasswordValid;
  } else {
    // Try the actual Password first (bcrypt; handle PHP $2y$ prefix)
    if (user_exists.Password) {
      const normalizedHash = user_exists.Password.startsWith('$2y$')
        ? '$2b$' + user_exists.Password.slice(3)
        : user_exists.Password;
      isPasswordValid = await bcrypt.compare(trimmedPassword, normalizedHash);
    }

    // If Password check failed, try Temp_Password as a fallback (user forgot password)
    if (!isPasswordValid && user_exists.Temp_Password) {
      usedTempPassword = trimmedPassword === user_exists.Temp_Password;
      isPasswordValid = usedTempPassword;
    }
  }

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  // Redirect to reset-password if:
  //  - Account is first-time (ResetPass = 'N'), OR
  //  - User authenticated using Temp_Password (forgot their main password)
  if (needsReset || usedTempPassword) {
    res.status(200).json({
      message: needsReset
        ? "Please set your password before continuing."
        : "Temporary password used. Please reset your password.",
      user_status: 0,
      id: user_exists.id,
      User_Id: user_exists.User_Id,
      User_Name: user_exists.User_Name,
    });
    return;
  }

  // Fetch role label from user_role_masters
  const User_Role_Master = db.user_role_masters;
  const roleRecord = await User_Role_Master.findOne({
    where: { user_role_code: String(user_exists.Role) },
  });

  console.log(`User ${user_exists.User_Id} authenticated successfully. Role code: ${user_exists.Role}, Role name: ${roleRecord ? roleRecord.user_role : 'Unknown'}`);
  const role_name = roleRecord ? roleRecord.user_role : 'Unknown';

  // Update Login_Status to 'Y' in database
  console.log(`Setting Login_Status='Y' for user ${user_exists.User_Id}`);
  await user_exists.update({ Login_Status: 'Y' });
  console.log(`Login_Status updated successfully for user ${user_exists.User_Id}`);

  // Generate JWT (no token_version — column not present in this schema)
  generateToken(res, user_exists.id, undefined, user_exists.Email_Id);
  console.log(`✅ JWT cookie set for user ${user_exists.User_Id} (Email: ${user_exists.Email_Id})`);

  // Store session in Redis for fast middleware lookups
  if (redisClient.isConnected()) {
    try {
      const redisKey = `user:${user_exists.Email_Id}`;
      const redisData = {
        id: String(user_exists.id),
        User_Id: String(user_exists.User_Id),
        User_Name: String(user_exists.User_Name || ''),
        Email_Id: String(user_exists.Email_Id || ''),
        D_Code: String(user_exists.D_Code || ''),
        Role: String(user_exists.Role),
        role_name: String(role_name),
        Block: String(user_exists.Block || ''),
        state_coord_dcode: String(user_exists.state_coord_dcode || ''),
        examiner_subcode: String(user_exists.examiner_subcode || ''),
        updatedAt: new Date().toISOString(),
      };
      await redisClient.hSet(redisKey, redisData);
      await redisClient.expire(redisKey, 14400); // 4 hours TTL
    } catch (redisErr) {
      console.warn('⚠ Could not store session in Redis:', redisErr.message);
    }
  }

  req.session.userid = {
    id: user_exists.id,
    User_Id: user_exists.User_Id,
    User_Name: user_exists.User_Name,
    Role: user_exists.Role,
    User_Ip: clientIP,
  };
  req.session.save();

  await User_Log.create({
    User_Name: user_exists.User_Id,
    User_Acticity: "Login",
    User_Ip: clientIP,
  });

  res.status(200).json({
    message: `${role_name} logged in successfully`,
    user_status: 1,
    user_Success: true,
    id: user_exists.id,
    User_Id: user_exists.User_Id,
    User_Name: user_exists.User_Name,
    D_Code: user_exists.D_Code,
    Role: user_exists.Role,
    role_name,
    Email_Id: user_exists.Email_Id,
    Block: user_exists.Block,
    state_coord_dcode: user_exists.state_coord_dcode,
    examiner_subcode: user_exists.examiner_subcode,
  });
});

const password_reset = asyncHandler(async (req, res, next) => {
  const {
    user_id: username,
    password,
    confirmPassword,
  } = req.body;
  if (!username || !password || !confirmPassword) {
    return next(new AppError("Please provide User ID and Password", 401));
  }

  if (password !== confirmPassword) {
    return next(
      new AppError("Password and Confirm Password do not match", 401),
    );
  }

  // Find user by User_Id only — covers both:
  //   1. First-time login (ResetPass = 'N')
  //   2. Forgot-password flow (ResetPass = 'Y', used Temp_Password to authenticate)
  const result = await User_Details.findOne({
    where: { User_Id: username },
  });

  if (!result) {
    return next(new AppError("User not found. Please check your User ID.", 401));
  }

  result.Password = bcrypt.hashSync(password, 10);
  result.ResetPass = 'Y';
  result.Temp_Password = null; // invalidate temp password after reset
  const result_updated = await result.save();

  res.status(200).json({
    Message: "Password Reset Successfully",
    User_Name: result_updated.User_Name,
    success: true
  });
});

const logout = asyncHandler(async (req, res) => {
  const clientIP = getClientIP(req);
  const token = req.cookies.jwt;

  let userIdForLog = null;

  // Only verify token and clear Redis if token exists
  if (token) {
    try {
      const TokenValue = verifyToken(token);
      const userId = TokenValue.userId;

      // Get user info and clear Redis session
      const user = await User_Details.findByPk(userId);
      if (user) {
        userIdForLog = user.User_Id;

        // Update Login_Status to 'N' in database
        console.log(`Setting Login_Status='N' for user ${user.User_Id}`);
        await user.update({ Login_Status: 'N' });
        console.log(`Login_Status updated successfully for user ${user.User_Id}`);

        // Clear Redis data for this user
        if (redisClient.isConnected()) {
          const redisKey = `user:${user.Email_Id}`;
          try {
            const deleteResult = await redisClient.del(redisKey);
            if (deleteResult) {
              console.log(`✅ Redis session cleared for user: ${user.Email_Id}`);
            } else {
              console.warn(`⚠ No Redis session found for user: ${user.Email_Id}`);
            }

            // Also clear any other user-related keys if they exist
            const userKeys = await redisClient.keys(`user:${user.Email_Id}*`);
            if (userKeys && userKeys.length > 0) {
              for (const key of userKeys) {
                await redisClient.del(key);
                console.log(`✅ Cleared additional Redis key: ${key}`);
              }
            }
          } catch (redisError) {
            console.error("❌ Error clearing Redis data on logout:", redisError);
            // Continue with logout even if Redis cleanup fails
          }
        } else {
          console.warn("⚠ Redis not connected, skipping Redis cleanup");
        }
      }
    } catch (err) {
      console.error("Error during logout token verification:", err);
      // Continue with logout even if token is invalid
    }
  }

  // Log the logout activity
  if (req.session && req.session.userid) {
    userIdForLog = userIdForLog || req.session.userid.User_Id;
  }

  if (userIdForLog) {
    try {
      await User_Log.create({
        User_Name: userIdForLog,
        User_Acticity: "Logout",
        User_Ip: clientIP,
      });
    } catch (logErr) {
      console.error("Error creating logout log entry:", logErr);
    }
  }

  // Destroy session
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
    });
  }

  // Clear JWT cookie
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

const passsent_email = asyncHandler(async (req, res, next) => {
  const clientIP = getClientIP(req);
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Please provide email", 401));
  }
  const result = await User_Details.findOne({ where: { Email_Id: email } });
  if (!result) {
    return next(new AppError("Incorrect email", 401));
  }

  const Candidate_email = result.Email_Id;
  if (!Candidate_email) {
    return next(new AppError("Email ID not found for the user", 401));
  }

  const User_Log_Update = await User_Log.create({
    User_Name: Candidate_email,
    User_Acticity: "Password Reset",
    User_Ip: clientIP,
  });

  const generatePasword = Math.random()
    .toString(36)
    .slice(-8)
    .toString()
    .toUpperCase();

  result.Temp_Password = generatePasword;
  result.User_Pass = bcrypt.hashSync(generatePasword, 10);
  result.ResetPass = "N";
  await result.save();
  const subject = "Password Reset";
  const emailBody = `
        <h1>Password Reset</h1>
        <p>Dear ${result.User_Name},</p>
        <p>Your temporary password is: <strong>${generatePasword}</strong></p>
        <p>Please log in and change your password immediately.</p>
  `;
  try {
    await sendEmail(Candidate_email, subject, emailBody);
    return res.status(200).json({
      Message: "Password sent to your email " + Candidate_email,
    });
  } catch (error) {
    return next(new AppError("Email not sent", 401));
  }
});

module.exports = {
  registerUser,
  loginUser,
  password_reset,
  passsent_email,
  logout,
};
