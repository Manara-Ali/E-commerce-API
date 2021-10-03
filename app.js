///////////////////////////////////////// Import Modules ////////////////////////////////////////

// Import express to be able to create servers
const express = require("express");

// Import morgan
const morgan = require("morgan");

// Import express rate limiter
const rateLimit = require("express-rate-limit");

// Import express mongo sanitize
const mongoSanitize = require("express-mongo-sanitize");

// Import helmet to add http headers
const helmet = require("helmet");

// Import xss-clean to protect against html attacks
const xss = require("xss-clean");

// Import http parameter pollution to protect against parameter pollution
const hpp = require("hpp");

// Import dotenv module
const dotenv = require("dotenv");

// Import the product router to redirect traffic
const productRouter = require("./routes/productRoutes");

// Import the user router
const userRouter = require("./routes/userRoutes");

// Import the application error class
const ApplicationError = require("./utils/ApplicationError");

// Import the global error handler function
const globalErrorHandler = require("./controller/errorController");

// Import the review router
const reviewRouter = require("./routes/reviewRoutes");

///////////////////////////////////////// CREATE MIDDLEWARE /////////////////////////////////////

// Use the dotenv module to connect to the config.env file
dotenv.config({
  path: `${__dirname}/config.env`,
});

// Create a variable to hold all of our express methods
const app = express();

// Use helmet to add more http headers
app.use(helmet());

// Use express rate limit to manage the number of request we get from the same IP address
app.use(
  "/api",
  rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many request from this IP address! Try again in 1 hour.",
  })
);

// Create a middleware to read the body
app.use(express.json({ limit: "10kb" }));

// Use mongo sanitize to prevent from NoSQL query injection
app.use(mongoSanitize());

// Use xss-clean to protect against script attacks
app.use(xss());

// Use hpp to prevent parameter pollution
app.use(
  hpp({
    whitelist: ["price", "ratingsAverage", "ratingsQuantity", "priceDiscount"],
  })
);

// Use morgan to help during development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Use the product middleware to redirect traffic to the product list
app.use("/api/v1/products", productRouter);

// Create a route to handle request regarding users
app.use("/api/v1/users", userRouter);

// Create a route to handle reviews
app.use("/api/v1/reviews", reviewRouter);

// Create a middleware for undefined routes
app.all("*", (request, response, next) => {
  // Create a new instance of an application error
  const applicationError = new ApplicationError(
    `Cannot find this route: ${request.originalUrl} on our servers!`,
    404
  );

  // Send the error to the global error handling middleware
  next(applicationError);
});

// Create a global handling middleware
app.use(globalErrorHandler);

///////////////////////////////////////// EXPORT MODULES ////////////////////////////////////////

// Export the app module to be used in other parts of our application
module.exports = app;
