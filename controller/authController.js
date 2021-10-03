//////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import util module to help verify jwt token
const { promisify } = require("util");

// Import crypto to be able to hash the reset token
const crypto = require("crypto");

// Import jsonwebtoken to create token and login users
const jwt = require("jsonwebtoken");

// Import the user model to help manipulate users inside our database
const User = require("./../model/userModel");

// Import the catch async module to help catch errors inside our application
const catchAsyncFn = require("./../utils/catchAsyncFn");

// Import Application error class
const ApplicationError = require("./../utils/ApplicationError");

// Import the email module
const sendEmail = require("./../utils/email");

// Import the module to create and send a cookie
const createAndSendCookies = require("./../utils/createTokenSendCookie");

/////////////////////////////////// CREATE FUNCTION FOR SIGN UP /////////////////////////////////

exports.signup = catchAsyncFn(async (request, response, next) => {
  const user = await User.create({
    name: request.body.name,
    role: request.body.role,
    email: request.body.email,
    photo: request.body.photo,
    password: request.body.password,
    passwordConfirm: request.body.passwordConfirm,
  });

  // Create cookie and send a response
  createAndSendCookies(user, 201, response);
});

/////////////////////////////////// CREATE FUNCTION FOR LOGIN //////////////////////////////////
exports.login = catchAsyncFn(async (request, response, next) => {
  // 1. Retrieve both the email and password from the user
  const { email, password } = request.body;

  // 2. If email or password is missing throw an error
  if (!email || !password) {
    // Create an instance of an error
    const applicationError = new ApplicationError(
      "Email and password are required!",
      400
    );

    // Send back a response
    return next(applicationError);
  }

  // 3. Use email to find user inside the database and verify that the provided password match
  const user = await User.findOne({ email: email }).select("+password");

  // 3.1 Inside the model, create an instance method to compare passwords

  // 4. If either the email or password is incorrect throw an error
  if (!user || !(await user.comparePassword(password, user.password))) {
    // Create an instance of an error
    const applicationError = new ApplicationError(
      "Incorrect email or password!",
      401
    );

    // Send back a response
    return next(applicationError);
  }

  // Create cookie and send a response
  createAndSendCookies(user, 200, response);
});

///////////////////////////////// CREATE FUNCTION PROTECT ROUTES ////////////////////////////////
exports.protect = catchAsyncFn(async (request, response, next) => {
  let token;
  // 1. Verify that the user is logged in
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith("Bearer")
  ) {
    token = request.headers.authorization.split(" ")[1];
  }

  // 2. If the user is not logged in throw an error
  if (!token) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "You are not logged in! Please log in before you can access this resource.",
      401
    );

    // Send back a response
    return next(applicationError);
  }
  // 3. Find the payload
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  // 3.1 Verify that the payload has not been tempered with
  // 3.2 Verify that the token has not expired and is still valid

  // 4. Find the current user from the payload
  const currentUser = await User.findById(decoded.id).select("+password");

  // 5. Verify that the user is still registered and was not deleted after log in happened
  if (!currentUser) {
    // Create an instance of an error
    const applicationError = new ApplicationError(
      "This user does not exist! Please log back in",
      401
    );

    // Send back a response
    return next(applicationError);
  }

  // 6. Verify that the user password did not change after login
  if (currentUser.passwordChangedAfterLogin(decoded.iat)) {
    // Create a new instance error
    const applicationError = new ApplicationError(
      "Your password recently changed! Please log back in.",
      400
    );

    // Send back a response
    return next(applicationError);
  }

  // 7. Attach the current user to the request body to be carried around in our application
  request.user = currentUser;

  // 8. NEXT
  next();
});

//////////////////////// CREATE FUNCTION TO RESTRICT CERTAIN ROUTES /////////////////////////////

exports.restrictTo = (...args) => {
  return (request, response, next) => {
    if (!args.includes(request.user.role)) {
      // Create an instance of an error
      const applicationError = new ApplicationError(
        "You do not have access to this ressource!",
        400
      );

      // Send back a response
      return next(applicationError);
    }
    next();
  };
};

////////////////////////////// CREATE FUNCTION FOR FORGET PASSWORD //////////////////////////////
exports.forgotPassword = catchAsyncFn(async (request, response, next) => {
  // 1. Retrieve email from the user
  const { email } = request.body;

  // 2. If no email was provided throw an error
  if (!email) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "Email is required to reset password!",
      400
    );

    // Send back a response
    return next(applicationError);
  }

  // 3. Verify that the provided email exist in our database
  const user = await User.findOne({ email: email });

  // 4. If no email was found throw an error
  if (!user) {
    // Create an instance of an error
    const applicationError = new ApplicationError(
      "No user was found with this email! Try again later.",
      400
    );

    // Send back the response
    return next(applicationError);
  }

  // 5. Create a reset token
  // 5.1 Create an instance methods that will generate the token
  const resetToken = user.createPasswordResetToken();

  // 5.2 Persist the changes to the database
  await user.save({ validateBeforeSave: false });

  // 6. Create a reset token URL
  const resetTokenURL = `${request.protocol}://${request.get(
    "host"
  )}/api/v1/users/reset-password/${resetToken}`;

  // 7. Create a reset token message
  const resetTokenMsg = `Forgot password? Submit your new passwor to the following link\n${resetTokenURL}\nYour reset token is only valid for 10 minutes!`;

  // 10. Send the email
  try {
    await sendEmail({
      email: user.email,
      message: resetTokenMsg,
    });
    // Send a response
    response.status(200).json({
      status: "success",
      message: "A reset token was sent to your email on file!",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpirationDate = undefined;
    await user.save({ validateBeforeSave: false });
    // Create an application error
    const applicationError = new ApplicationError(
      "We are unable to send email at this time! Try again later.",
      500
    );
    // Send back a response
    next(applicationError);
  }
});

///////////////////////////// CREATE FUNCTION FOR RESETING PASSWORD /////////////////////////////
exports.resetPassword = catchAsyncFn(async (request, response, next) => {
  // 1. Retrieve the reset token from the url
  const resetToken = request.params.token;

  // 2. Hash the received token to be able to compare to the one we have in our database
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 2. Find the user based on the reset token and verify that the token has not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpirationDate: { $gt: Date.now() },
  });

  // 3. If there is no user or the reset token has expired, throw an error
  if (!user) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "Invalid or Expired token!",
      400
    );

    //   Send back a response
    return next(applicationError);
  }

  // 4. Remove the token from the database
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpirationDate = undefined;

  // 6. Set the new password as the user password
  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;

  // 5. Update the time the password was changed in the schema

  // 7. Persist the changes to the database with validation turned on
  await user.save();

  // Create cookie and send a response
  createAndSendCookies(user, 200, response);
});

////////////////////////////// CREATE FUNCTION TO UPDATE PASSWORD ///////////////////////////////
exports.updatePassword = catchAsyncFn(async (request, response, next) => {
  // 1. Retrieve the current logged in user
  const user = await User.findById(request.user._id).select("+password");

  // 2. Retrieve the user current password
  const { currentPassword } = request.body;

  // 3. Assuming no password was provided, throw an error
  if (!currentPassword) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "Current password is required!",
      400
    );

    // Send back a response
    return next(applicationError);
  }

  // 4. Verify that the provided password match the password we have on file
  if (!(await user.comparePassword(currentPassword, user.password))) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "Incorrect password! Try again.",
      404
    );

    // Send back a response
    return next(applicationError);
  }

  // 5. Make changes to the database to update user password. DO NOT use findByIdAndUpdate
  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;

  // Create cookie and send a response
  createAndSendCookies(user, 200, response);
});
