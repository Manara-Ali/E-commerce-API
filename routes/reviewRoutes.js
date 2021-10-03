///////////////////////////////////////// IMPORT MODULE /////////////////////////////////////////

// Import express to be able to create router
const express = require("express");

///////////////////////////////////////// CREATE ROUTER /////////////////////////////////////////

// Create a router for reviews
const reviewRouter = express.Router({ mergeParams: true });

// Import review controller
const reviewController = require("./../controller/reviewController");

// Import auth controller
const authController = require("./../controller/authController");

///////////////////////////////////////// CREATE ROUTES /////////////////////////////////////////

// Protect all reviews routes
reviewRouter.use(authController.protect);

// Create routes for retrieving all review and creating new reviews
reviewRouter
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setProductAndUserId,
    reviewController.createReview
  );

reviewRouter
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.verify,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.verify,
    reviewController.deleteReview
  );

///////////////////////////////////////// EXPORT MODULE /////////////////////////////////////////

// Export module to be used in other parts of our application
module.exports = reviewRouter;
