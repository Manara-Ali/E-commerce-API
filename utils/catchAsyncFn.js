// Create a function to catch error inside of asynchronous functions
const catchAsyncFn = function(asyncFn) {
  return (request, response, next) => {
    asyncFn(request, response, next).catch((error) => {
      next(error);
    });
  };
};

// Export the catch async function to be used in other parts of our application
module.exports = catchAsyncFn;
