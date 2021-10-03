///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import the Applicaton error class
const ApplicationError = require("./../utils/ApplicationError");

///////////////////////// TRANSFORM MONGODB ERRORS INTO OPERATIONAL ERRORS  /////////////////////

// 1. Create a funciton to transform Cast Error into an Operational error
const handleCastErrorDB = (error) => {
  // Create a new instance of an error
  const applicationError = new ApplicationError(
    `Invalid ${error.path}: "${error.value}"`,
    404
  );
  return applicationError;
};

// 2. Create a function to handle Duplicate key error
const handleDuplicateErrorDB = (error) => {
  // Lets retrive the object values of all the keys
  const keysArr = Object.keys(error);

  // Lets find the key of our value
  const keyValue = keysArr.filter((element) => {
    return element === "keyValue";
  });

  // Lets retrieve the value itself
  const value = error[keyValue[0]].name || error[keyValue[0]].email;

  // Create an instance of an error
  const applicationError = new ApplicationError(
    `Duplicate error: "${value}" already exist!`,
    404
  );

  // Send back the response
  return applicationError;
};

// 3. Create Validation Error
const handleValidationErrorDB = (error) => {
  // Retrieve the error array
  const errorArr = Object.values(error.errors);

  // Create a list of all the error messages
  const errorMsgArr = errorArr.map((element) => {
    return element.message;
  });

  // Create error message
  const errorMsg = errorMsgArr.join(" ");

  // Create an instance of an error
  const applicationError = new ApplicationError(`${errorMsg}`, 404);

  // Send back a response
  return applicationError;
};

// 4. JsonWebToken Error
const handleJsonWebTokenErrorDB = (error) => {
  // Create a new instance error
  const applicationError = new ApplicationError(
    "Invalid token! Please log back in.",
    401
  );

  // Send back a response
  return applicationError;
};

// 5. TokenExpired Error
const handleTokenExpiredErrorDB = (error) => {
  // Create an instance of an error
  const applicationError = new ApplicationError(
    "Expired token! Please log back in.",
    401
  );

  // Send back a response
  return applicationError;
};

/////////////////////////////// OPERATINAL ERROR VS PROGRAMMING ERROR ///////////////////////////

// Create a function to send error back during development
const sendDevError = (error, response) => {
  response.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};

// Create a function to send error back during production
const sendProdError = (error, response) => {
  // Operational error
  if (error.isOperational) {
    response.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    response.status(error.statusCode).json({
      status: error.status,
      message: "Something went wrong!",
    });
  }
};

////////////////////////////////// GLOBAL ERROR HANDLING FUNCTION ///////////////////////////////

// Create a new global error handling function
const globalErrorHandler = (error, request, response, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  // Assuming we are in development, we want to send as much information as possible to devs
  if (process.env.NODE_ENV === "development") {
    sendDevError(error, response);
  } else if (process.env.NODE_ENV === "production") {
    // Initialize an error variable
    let mongooseError;

    // 1. Cast Error
    if (error.name === "CastError") {
      mongooseError = { ...error };
      mongooseError = handleCastErrorDB(mongooseError);
      sendProdError(mongooseError, response);
    }

    // 2. Duplicate Error
    if (error.code === 11000) {
      mongooseError = { ...error };
      mongooseError = handleDuplicateErrorDB(mongooseError);
      sendProdError(mongooseError, response);
    }

    // 3. Validation Error
    if (error.name === "ValidationError") {
      mongooseError = { ...error };
      mongooseError = handleValidationErrorDB(mongooseError);
      sendProdError(mongooseError, response);
    }

    // 4. JsonWebToken Error
    if (error.name === "JsonWebTokenError") {
      mongooseError = { ...error };
      mongooseError = handleJsonWebTokenErrorDB(mongooseError);
      sendProdError(mongooseError, response);
    }

    // 5. TokenExpired Error
    if (error.name === "TokenExpiredError") {
      mongooseError = { ...error };
      mongooseError = handleTokenExpiredErrorDB(mongooseError);
      sendProdError(mongooseError, response);
    }

    if (!mongooseError) {
      sendProdError(error, response);
    }
  }
};

// Export the global error handling function to be used in other parts of our application
module.exports = globalErrorHandler;
