///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import the product model to help create new models
const Product = require("./../model/productModel");

// Import the APIFeatures class
const APIFeatures = require("./../utils/APIFeatures");

// Import the catch async function
const catchAsyncFn = require("./../utils/catchAsyncFn");

// Import Application error
const ApplicationError = require("./../utils/ApplicationError");

// Import the factory handler module
const factoryHandler = require("./../controller/factoryHandler");

///////////////////////////////////////// CREATE METHODS ////////////////////////////////////////

// Create a route to calculate products statistics
exports.productStats = catchAsyncFn(async (request, response, next) => {
  const stats = await Product.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4 } },
    },
    {
      $group: {
        _id: "$quality",
        numberOfProducts: { $sum: 1 },
        nameOfProduct: { $push: "$name" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        avgPrice: { $avg: "$price" },
      },
    },
    {
      $addFields: { quality: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
  ]);
  response.status(200).json({
    status: "success",
    results: stats.length,
    data: {
      stats: stats,
    },
  });
});

// Create a function to calculate business plan
exports.monthlyPlan = catchAsyncFn(async (request, response, next) => {
  // Retrieve the year from the url
  const year = +request.params.year;

  // Use aggregation
  const plan = await Product.aggregate([
    {
      $unwind: "$createdAt",
    },
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: "$gender",
        numberOfProduct: { $sum: 1 },
        productName: { $push: "$name" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        avgPrice: { $avg: "$price" },
      },
    },
    {
      $sort: { numberOfProduct: -1 },
    },
    {
      $addFields: { productGender: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
  ]);

  // Send back a response
  response.status(200).json({
    status: "success",
    results: plan.length,
    data: {
      plan: plan,
    },
  });
});

////////////////////////// GEOSPATIAL QUERY /////////////////////////////////////
exports.productsWithin = catchAsyncFn(async (request, response, next) => {
  // Retrieve all the parameters form the url
  const { distance, latlng, unit } = request.params;

  const radiusInRadians = unit === "mi" ? distance / 3958.8 : distance / 6371;

  // Identify the latitude and longitude
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "Please specify the latitude and longitude of the center point",
      400
    );

    // Send back the response
    return next(applicationError);
  }

  // Find the products
  const products = await Product.find({
    productLocation: {
      $geoWithin: {
        $centerSphere: [[+lng, +lat], radiusInRadians],
      },
    },
  });
  // console.log(products);
  // Send back a response
  response.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products: products,
    },
  });
});

////////////////////////// GEOSPATIAL AGGREGATE. DISTANCE NEAR /////////////////////////////////////
exports.productsNear = catchAsyncFn(async (request, response, next) => {
  // Retrieve the parameters from the url
  const { latlng, unit } = request.params;

  // Distance multiplier
  const distanceMultiplier = unit === "mi" ? 0.000621371 : 0.001;

  // Split the latlng to get the latitude and longitude
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) {
    // Create an instance of an error
    const applicationError = new ApplicationError(
      "Please specify the latitude and longitude of the center point",
      400
    );

    // Send back the error
    return next(applicationError);
  }

  const products = await Product.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [+lng, +lat],
        },
        key: "productLocation",
        distanceField: "distance",
        distanceMultiplier: distanceMultiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  // Send back a response
  response.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products: products,
    },
  });
});

////////////////////////// MIDDLEWARE FOR UPDATING PRODUCTS /////////////////////////////////////
exports.verify = catchAsyncFn(async (request, response, next) => {
  // Find the product that needs their information changed
  const product = await Product.findById(request.params.id);

  // Find the author of the product
  const authorId = JSON.stringify(product.seller[0]._id);

  // Verify the product belongs to the logged in user looking to make changes
  if (
    authorId !== JSON.stringify(request.user._id) &&
    request.user.role !== "admin"
  ) {
    // Create an instance error
    const applicationError = new ApplicationError(
      "You do not have authorizarion to make any changes to this product!",
      401
    );

    // Send back a response
    return next(applicationError);
  }
  next();
});

////////////////////////// FACTORY HANDLER FUNCTIONS ////////////////////////////////////////////

exports.getAllProducts = factoryHandler.getAll(Product);
exports.getProduct = factoryHandler.getOne(Product, {
  path: "reviews",
  select: "-__v",
});
exports.createProduct = factoryHandler.createOne(Product);
exports.updateProduct = factoryHandler.updateOne(Product);
exports.deleteProduct = factoryHandler.deleteOne(Product);

///////////////////////////////////////// EXPORT MODULES ////////////////////////////////////////
