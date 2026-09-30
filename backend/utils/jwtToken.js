const jwt = require('jsonwebtoken')
  const generateToken = (res, userId,token_version,Email_Id) => {
    const token = jwt.sign({ userId,token_version,Email_Id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    })
        // Set JWT as HTTP-Only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
      path: '/', // Explicitly set path
    };
    
    console.log('🍪 Setting JWT cookie with options:', {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      maxAge: cookieOptions.maxAge,
      path: cookieOptions.path,
      NODE_ENV: process.env.NODE_ENV
    });
    
    res.cookie('jwt', token, cookieOptions);
    
  }
  const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET)
  }

module.exports ={generateToken,verifyToken}