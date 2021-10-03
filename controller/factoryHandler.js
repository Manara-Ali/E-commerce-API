///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import the catch async function
const catchAsyncFn = require("./../utils/catchAsyncFn");

// Import the Application Error
const ApplicationError = require("./../utils/ApplicationError");

// Import API Features class
const APIFeatures = require("./../utils/APIFeatures");

//////////////////////////// CREATE A FUNCTION TO DELETE ONE DOCUMENT ///////////////////////////
exports.deleteOne = (Model) => {
  return catchAsyncFn(async (request, response, next) => {
    const document = await Model.findByIdAndDelete(request.params.id);
    // Create a 404 if no tour is found
    if (!document) {
      // Create an instance of an application error
      const applicationError = new ApplicationError(
        "No document found with that ID",
        404
      );

      // Send back a response
      return next(applicationError);
    }
    response.status(204).json({
      status: "success",
      data: null,
    });
  });
};

//////////////////////////// CREATE A FUNCTION TO UPDATE ONE DOCUMENT ///////////////////////////
exports.updateOne = (Model) => {
  return catchAsyncFn(async (request, response, next) => {
    const document = await Model.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true }
    );
    // Create a 404 if no tour is found
    if (!document) {
      // Create an instance of an application error
      const applicationError = new ApplicationError(
        "No document found with that ID",
        404
      );

      // Send back a response
      return next(applicationError);
    }
    response.status(200).json({
      status: "success",
      data: {
        document: document,
      },
    });
  });
};

////////////////////////// CREATE A FUNCTION TO RETRIEVE ONE DOCUMENT ///////////////////////////
exports.getOne = (Model, populateOptions) => {
  return catchAsyncFn(async (request, response, next) => {
    // Create the query
    let query = Model.findById(request.params.id);

    // For every populate options, populate the query
    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    // Await the query to create a document
    const document = await query;

    // Create a 404 if no tour is found
    if (!document) {
      // Create an instance of an application error
      const applicationError = new ApplicationError(
        "No document found with that ID",
        404
      );

      // Send back a response
      return next(applicationError);
    }
    response.status(200).json({
      status: "success",
      data: {
        document: document,
      },
    });
  });
};

////////////////////////// CREATE A FUNCTION TO CREATE ONE DOCUMENT ///////////////////////////

exports.createOne = (Model) => {
  return catchAsyncFn(async (request, response, next) => {
    // Add the product seller to the request body
    request.body.seller = request.user._id;
    const document = await Model.create(request.body);
    response.status(201).json({
      status: "success",
      data: {
        document: document,
      },
    });
  });
};

////////////////////////// CREATE A FUNCTION TO RETRIEVE ALL DOCUMENTS ///////////////////////////
exports.getAll = (Model) => {
  return catchAsyncFn(async (request, response, next) => {
    const filterReviews = {};
    if (request.params.productId) {
      filterReviews.product = request.params.productId;
    }
    // Create a new instance of the APIFeatures
    const apiFeatures = new APIFeatures(
      Model.find(filterReviews),
      request.query
    );

    // Apply filter
    apiFeatures
      .filter()
      .sort()
      .paginate()
      .limitFields();

    const documents = await apiFeatures.query;
    response.status(200).json({
      status: "success",
      results: documents.length,
      data: {
        documents: documents,
      },
    });
  });
};
