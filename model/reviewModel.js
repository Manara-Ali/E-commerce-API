///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import mongoose in order to be able to create models
const { request } = require("express");
const mongoose = require("mongoose");

// Import the product model
const Product = require("./../model/productModel");

// Import the user model
const User = require("./userModel");

///////////////////////////////////////// CREATE SCHEMA /////////////////////////////////////////

const reviewSchema = mongoose.Schema({
  review: {
    type: String,
    required: [true, "Each review must have some text"],
    trim: true,
  },
  rating: {
    type: Number,
    required: [true, "Each review requires a ratings between 1 and 5."],
    min: [1, "Ratings cannot be less than 1"],
    max: [5, "Ratings cannot be less than 1"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "Each review must belong to a product"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Each review must have an author."],
  },
});

///////////////////////////////////// CREATE INDEXES ////////////////////////////////////////
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

///////////////////////////////////// CREATE MIDDLEWARES ////////////////////////////////////////

// Create middleware to populate reviews
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: "user",
    select: "name",
  });
  next();
});

///////////////////////////////// CREATE STATISTICS METHOD //////////////////////////////////////
reviewSchema.statics.calcRatings = async function(product) {
  // Find the product in order to retrieve the seller of that product
  const reviewedProduct = await Product.findById(product);

  // Create statistics
  const stats = await this.aggregate([
    {
      $match: { product: product },
    },
    {
      $group: {
        _id: "$product",
        numberOfRatings: { $sum: 1 },
        ratingsAvg: { $avg: "$rating" },
        maxRating: { $max: "$rating" },
      },
    },
  ]);

  if (stats.length) {
    // Give the seller a rating value
    reviewedProduct.seller[0].rating =
      Math.round(stats[0].ratingsAvg * 10) / 10; // Round up the rating`

    // Give the seller a rating quantity
    reviewedProduct.seller[0].ratingsQuantity = stats[0].numberOfRatings;

    // console.log(stats);
    // console.log(reviewedProduct);

    // Update seller rating
    await User.findByIdAndUpdate(reviewedProduct.seller[0]._id, {
      rating: reviewedProduct.seller[0].rating,
      ratingsQuantity: reviewedProduct.seller[0].ratingsQuantity,
    });

    // Update the product rating
    await Product.findByIdAndUpdate(reviewedProduct._id, {
      bestRating: stats[0].maxRating,
      ratingsQuantity: stats[0].numberOfRatings,
    });
  } else {
    // Update seller rating
    await User.findByIdAndUpdate(reviewedProduct.seller[0]._id, {
      rating: 4.5,
      ratingsQuantity: 0,
    });

    // Update the product rating
    await Product.findByIdAndUpdate(reviewedProduct._id, {
      bestRating: null,
      ratingsQuantity: 0,
    });
  }
};

//////////////////// CREATE POST MIDDLEWARE TO CALL THE STATISTICS METHOD ///////////////////////

// Use a post middleware to make calculations when a new review is created
reviewSchema.post("save", function() {
  this.constructor.calcRatings(this.product);
});

// Use a post middleware to make calculation when a query is updated or deleted
reviewSchema.post(/^findOneAnd/, function(document) {
  document.constructor.calcRatings(document.product);
});

///////////////////////////////////////// CREATE MODEL //////////////////////////////////////////

// Create review model
const Review = new mongoose.model("Review", reviewSchema);

///////////////////////////////////////// EXPORT MODULE /////////////////////////////////////////

// Export module to be used in other parts of our application
module.exports = Review;
