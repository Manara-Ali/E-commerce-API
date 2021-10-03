///////////////////////////////////////// IMPORT MODULE /////////////////////////////////////////

// Import catch async to catch errors inside of asynchronous functions
const catchAsyncFn = require("./../utils/catchAsyncFn");

// Import the review Model
const Review = require("./../model/reviewModel");

// Import the factory handler
const factoryHandler = require("./../controller/factoryHandler");

// Import application error class
const ApplicationError = require("./../utils/ApplicationError");

/////////////////// CREATE MIDDLEWARE TO SET UP THE PRODUCT AND USER ID /////////////////////////

exports.setProductAndUserId = (request, response, next) => {
  // Attach the logged in user to the request
  if (!request.body.user) {
    request.body.user = request.user._id;
  }
  if (!request.body.product) {
    request.body.product = request.params.productId;
  }
  next();
};

exports.verify = catchAsyncFn(async (request, response, next) => {
  // Find the product that needs their information changed
  const review = await Review.findById(request.params.id);

  // Find the author of the review
  const authorId = JSON.stringify(review.user._id);

  // Verify the review belongs to the logged in user looking to make changes
  if (
    authorId !== JSON.stringify(request.user._id) &&
    request.user.role !== "admin"
  ) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "You do not have authorizarion to make any changes to this review!",
      401
    );

    // Send back a response
    return next(applicationError);
  }
  next();
});

///////////////////////////////////// DELETE REVIEW ////////////////////////////////////////
exports.getAllReviews = factoryHandler.getAll(Review);
exports.getReview = factoryHandler.getOne(Review);
exports.createReview = factoryHandler.createOne(Review);
exports.updateReview = factoryHandler.updateOne(Review);
exports.deleteReview = factoryHandler.deleteOne(Review);
