///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import express to be able to create new routers
const express = require("express");

// Import user controller
const userController = require("./../controller/userController");

// Import the auth controller
const authController = require("./../controller/authController");

///////////////////////////////////////// CREATE NEW ROUTERS ////////////////////////////////////

// Create a new router to be able to direct traffic to users
const userRouter = express.Router();

///////////////////////////////////////// CREATE NEW ROUTES ////////////////////////////////////

// Create a route for signing up new users
userRouter.route("/signup").post(authController.signup);

// Create a route to log in users
userRouter.route("/login").post(authController.login);

// Create a route for forgot password
userRouter.route("/forgot-password").post(authController.forgotPassword);

// Create a route for reseting passwords
userRouter.route("/reset-password/:token").get(authController.resetPassword);

//////////////////////////////// USE ROUTERS TO REDIRECT TRAFFIC ////////////////////////////////

//////////////// PROTECT ALL ROUTES THAT COME AFTER THIS POINT ////////////////
userRouter.use(authController.protect);

// Create a route for users to update their password
userRouter.route("/update-password").patch(authController.updatePassword);

// Create a route for retrieve personal account information
userRouter
  .route("/my-account")
  .get(
    authController.protect,
    userController.myAccount,
    userController.getUser
  );

// Create a route to help users update their information
userRouter.route("/update-my-account").patch(userController.updateMyAccount);

// Create a route to allow users to delete their account
userRouter.route("/delete-my-account").delete(userController.deleteMyAccount);

////////////////// RESTRICT THESE FUNCTIONALITY ONLY TO ADMIN /////////////////
userRouter.use(authController.restrictTo("admin"));

userRouter
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

///////////////////////////////////////// EXPORT MODULE /////////////////////////////////////////

// Export module to be used in other parts of our application
module.exports = userRouter;
