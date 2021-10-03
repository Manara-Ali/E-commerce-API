class APIFeatures {
  constructor(query, queryParameters) {
    this.query = query;
    this.queryParameters = queryParameters;
  }

  filter = function() {
    // 1. Filtering
    // 1.2 Make a copy of the request query so we can keep reference of it
    const queryObj = { ...this.queryParameters };

    // 1.3 Remove any unwanted field from the query
    const unwantedFields = ["sort", "page", "limit", "fields"];

    unwantedFields.forEach((element) => {
      delete queryObj[element];
    });

    // 2. Advanced Filtering
    // 2.1 Lets create a queryString
    let queryString = JSON.stringify(queryObj);

    queryString = queryString.replace(/\b(gte|gt|lte|lt|ne)\b/g, (match) => {
      return `$${match}`;
    });

    // Define a query parameter
    this.query = this.query.find(JSON.parse(queryString));

    return this;
  };

  sort = function() {
    // 3. Sorting
    // 3.1 If there was a request for sorting
    if (this.queryParameters.sort) {
      // 3.2 Find the sort parameters
      const sortBy = this.queryParameters.sort.split(",").join(" ");
      // 3.3 Execute the query
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt _id");
    }

    return this;
  };

  paginate = function() {
    // 4. Pagination
    // 4.1 Find the page number
    const page = +this.queryParameters.page;

    // 4.2 Find the result limit
    const limit = +this.queryParameters.limit;

    // 4.3 Find the sort parameter
    const skip = (page - 1) * limit;

    // 4.4 Create the pagination
    this.query = this.query.skip(skip).limit(limit);

    return this;
  };

  limitFields = function() {
    // 5. Limiting Fields
    if (this.queryParameters.fields) {
      const limitFields = this.queryParameters.fields.split(",").join(" ");
      this.query = this.query.select(limitFields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  };
}

// Export the APIFeatures class to be used in other parts of our application
module.exports = APIFeatures;
