const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const redisClient = require("../config/redis");


const updateRoleDegree = asyncHandler(async (req, res) => {
  const { Email_Id } = req.body;

  // Validate required fields
  if (!Email_Id) {
    return res.status(400).json({ message: "Email_Id is required" });
  }

  // Check if Redis is available
  if (!redisClient.isConnected()) {
    console.warn('⚠ Redis not available. Data not cached.');
    return res.status(200).json({
      message: "Request received but Redis caching unavailable",
      warning: "Redis server is not running",
    });
  }

  const dbUser = await db.User_Details.findOne({ where: { Email_Id } });
  if (!dbUser) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const redisKey = `user:${Email_Id}`;

    const userData = {
      id: String(dbUser.id),
      Email_Id: String(dbUser.Email_Id),
      ...(dbUser.token_version !== undefined && { token_version: String(dbUser.token_version) }),
      ...(dbUser.DCODE !== undefined && dbUser.DCODE !== null && { DCODE: String(dbUser.DCODE) }),
      ...(dbUser.SUB_CEN !== undefined && dbUser.SUB_CEN !== null && { SUB_CEN: String(dbUser.SUB_CEN) }),
      ...(dbUser.Role !== undefined && { userRole: String(dbUser.Role) }),
      updatedAt: new Date().toISOString(),
    };

    await redisClient.hSet(redisKey, userData);
    await redisClient.expire(redisKey, 14400); // 4 hours

    res.status(200).json({ message: "User data updated successfully in Redis" });
  } catch (error) {
    console.error('❌ Redis error:', error.message);
    res.status(500).json({
      message: "Failed to update user data in Redis",
      error: error.message,
    });
  }
});

module.exports = {
  updateRoleDegree
};