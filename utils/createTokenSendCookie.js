//////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import jsonwebtoken to sign tokens
const jwt = require("jsonwebtoken");

/////////////////// CREATE FUNCTION SIGN TOKENS AND GENERATE COOKIES ////////////////////////////

// Create a function to sign tokens
const signToken = (user) => {
  // Login users with a token immediatly after they finished creating their account
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

// Create a function to generate cookies
const createAndSendCookies = (user, statusCode, response) => {
  // Create a token
  const token = signToken(user);

  user.password = undefined;

  // Set up the cookie options
  const cookieOptions = {
    expire: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: false,
    httpOnly: true,
  };

  // Set up the cookie secure option depending of our environment
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  // Create a cookie
  response.cookie("jwt", token, cookieOptions);

  // Send back a response
  response.status(statusCode).json({
    status: "success",
    token: token,
    data: {
      user: user,
    },
  });
};

//////////////////////////////////////// EXPORT MODULES ////////////////////////////////////////

// Export module to be used in other parts of our application
module.exports = createAndSendCookies;
