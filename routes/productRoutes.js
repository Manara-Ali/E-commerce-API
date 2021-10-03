///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import express to be able to create new routers
const express = require("express");

// Import our product controller to use our CRUD methods
const productController = require("./../controller/productController");

// Import auth controller
const authController = require("./../controller/authController");

// Import the review controller
const reviewController = require("./../controller/reviewController");

// Import the review router to use as a middleware
const reviewRouter = require("./../routes/reviewRoutes");

///////////////////////////////////////// CREATE ROUTER /////////////////////////////////////////

// Create a new product router
const productRouter = express.Router();

///////////////////////////////////////// CREATE METHODS ////////////////////////////////////////

///////////////////////////////////////// CREATE ROUTES ////////////////////////////////////////

// Create a route to calculate product statistics
productRouter.route("/product-stats").get(productController.productStats);

// Create a route for monthly plan
productRouter
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "seller"),
    productController.monthlyPlan
  );

// Create a Simple Nested Route
// productRouter.route("/:productId/reviews").post(reviewController.createReview);
productRouter.use("/:productId/reviews", reviewRouter);

// Create a route for geoSpatial query
productRouter
  .route("/products-within/:distance/center/:latlng/unit/:unit")
  .get(productController.productsWithin);

// Create a route to find the distances of all the product near a certain point
productRouter
  .route("/products-near/:latlng/unit/:unit")
  .get(productController.productsNear);

// Product routes
productRouter
  .route("/")
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo("seller", "admin"),
    productController.createProduct
  );
productRouter
  .route("/:id")
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo("seller", "admin"),
    productController.verify,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo("seller", "admin"),
    productController.verify,
    productController.deleteProduct
  );

///////////////////////////////////////// EXPORT MODULES ////////////////////////////////////////
module.exports = productRouter;
