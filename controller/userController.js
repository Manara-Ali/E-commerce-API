// Import catch async to catch error inside asynchronous functions
const ApplicationError = require("../utils/ApplicationError");

// Import the catch async function to catch errors inside asynchronous function
const catchAsyncFn = require("../utils/catchAsyncFn");

// Import a function to help filter user info to only the allowed parameters
const filterObj = require("./../utils/filterObj");

// Import user model
const User = require("./../model/userModel");

// Import the module to create and send a cookie
const createAndSendCookies = require("./../utils/createTokenSendCookie");

// Import the factory handler function
const factoryHandler = require("./../controller/factoryHandler");

///////////////// CREATE FUNCTION TO CREATE AND ADD NEW USERS TO DATABASE ///////////////////////
exports.createUser = (require, response) => {
  response.status(200).json({
    status: "success",
    data: {
      message: "Use '/signup' to create new users!",
    },
  });
};

//////////////////////// CREATE FUNCTION TO UPDATE USER INFO AS A USER //////////////////////////
exports.updateMyAccount = catchAsyncFn(async (request, response, next) => {
  // 1. Retrieve current user password
  const { currentPassword } = request.body;

  // 2. If no password was provided, throw an error
  if (!currentPassword) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "Current password is required!",
      400
    );

    // Send back a response
    return next(applicationError);
  }

  // 3. Find current user based on logged in token
  const user = await User.findById(request.user._id).select("+password");

  // 4. Verify that the provided password match the password of the current users
  if (!(await user.comparePassword(currentPassword, user.password))) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "Incorrect password! Try again later.",
      404
    );

    // Send back a response
    return next(applicationError);
  }

  // 7. Find the allowed parameters
  const allowedParameters = filterObj.filterObj(request.body, "name", "email");

  // 7. We are not changing the password and verified the user update with findByIdAndUpdate
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    allowedParameters,
    {
      new: true,
      runValidators: true,
    }
  );

  // Create and send a cookie
  createAndSendCookies(updatedUser, 200, response);
});

//////////////////////////// CREATE FUNCTION TO DELETE USERS ACCOUNT ////////////////////////////
exports.deleteMyAccount = catchAsyncFn(async (request, response, next) => {
  // 1. Verify that the user is logged in
  const { currentPassword } = request.body;

  // 2. If no password was passed in, throw an error
  if (!currentPassword) {
    // Create an instance of an error
    const applicationError = new ApplicationError(
      "Your current password is required!",
      400
    );

    // Send back a response
    return next(applicationError);
  }

  // 3. Find current user information
  const user = await User.findById(request.user._id).select("+password");

  // 4. Compare the provided password to the current user password and verify that they match
  if (!(await user.comparePassword(currentPassword, user.password))) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "Incorrect password! Try again.",
      404
    );

    // Send back a response
    return next(applicationError);
  }

  // 5. Use findByIdAndUpdate to update the user active property to false
  await User.findByIdAndUpdate(request.user.id, { active: false });
  console.log(user);
  // 6. Create query middleware to only find users that have the active property set to true

  // 7. Send a response
  response.status(204).json({
    status: "success",
    data: null,
  });
});
////////////////////////// FUNCTION TO RETRIEVE PERSONAL INFORMATION ////////////////////////////
exports.myAccount = (request, response, next) => {
  request.params.id = request.user._id;
  next();
};

////////////////////////// FACTORY HANDLER FUNCTIONS ////////////////////////////////////////////
exports.getAllUsers = factoryHandler.getAll(User);
exports.getUser = factoryHandler.getOne(User);
exports.updateUser = factoryHandler.updateOne(User);
exports.deleteUser = factoryHandler.deleteOne(User);
