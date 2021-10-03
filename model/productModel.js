///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import mongoose to create a product schema
const mongoose = require("mongoose");

// Import slugify to be able to create a slug
const slugify = require("slugify");

/////////////////////////////////////// CREATE MODEL SCHEMA /////////////////////////////////////

// Create a product schema
const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Each product must have a name."],
      trim: true,
      validate: {
        validator: function(value) {
          return value.length >= 10;
        },
        message: "Each product must be at least 10 characters long.",
      },
    },
    slug: {
      type: String,
      lowercase: true,
    },
    seller: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    gender: {
      type: String,
      required: [true, "Each product must have a gender"],
      trim: true,
      enum: {
        values: ["boy", "girl", "unisex"],
        message: `The genre can only be 'boy', 'girl', or 'unisex'!`,
      },
    },
    category: {
      type: String,
      enum: {
        values: ["toys", "clothes", "accessories", "other"],
        message: `Product category can only be 'toys', 'clothes', 'accessories' or 'other'.`,
      },
    },
    size: {
      type: String,
      required: [true, "Each product must have a size."],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Each product must have a price."],
      max: [5, "Products cannot be more than $5.00!"],
    },
    priceCurrency: {
      type: String,
      required: [true, "Each item price must have a currency!"],
      enum: {
        values: ["USD", "EUR", "GBP", "CAD", "AUD", "CNY"],
        message:
          "Please use any of the following currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CNY']",
      },
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function(value) {
          return value < this.price;
        },
      },
      message: "Discount price (VALUE) cannot be more than regular price!",
    },
    imageCover: {
      type: String,
      required: [true, "Each product must have a cover image."],
      trim: true,
    },
    images: {
      type: [String],
    },
    productLocation: {
      type: {
        type: String,
        default: "Point",
        enum: {
          values: ["Point"],
          message: "Product location can only be a point",
        },
      },
      coordinates: {
        type: [Number],
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
    },
    location: [
      {
        type: {
          type: String,
          default: "Point",
          enum: {
            values: ["Point"],
            message: "Product location can only be a point",
          },
        },
        coordinates: {
          type: [Number],
        },
        city: {
          type: String,
        },
        state: {
          type: String,
        },
      },
    ],
    bestRating: {
      type: Number,
      min: [1, "Ratings cannot be less than 1."],
      max: [5, "Ratings cannot be more than 5."],
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: [true, "Each product must have a quantity indicator."],
      min: [0, "Quantity cannot be less than 0."],
    },
    quality: {
      type: String,
      required: [true, "Each product must have a quality marker."],
      enum: {
        values: ["new", "used", "barely-used"],
        message: `Product quality can only 'new', 'used', or 'barely-used'!`,
      },
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Each product must have a brand."],
      trim: true,
    },
    color: {
      type: String,
      required: [true, "Each product must have a color."],
      trim: true,
    },
    summary: {
      type: String,
      required: [true, "Each product must have a summary."],
      trim: true,
      min: [50, "Each product summary must be at least 50 characters long."],
    },
    description: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    secretProduct: {
      type: Boolean,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

////////////////////////////////////////// CREATE INDEXES ////////////////////////////////////////
// Create an index for recuring queries
productSchema.index({ price: 1, bestRating: 1 });

// Create an index for the slug
productSchema.index({ slug: 1 });

// Create an index for the geospatial parameter
productSchema.index({ productLocation: "2dsphere" });

////////////////////////////////////////// VIRTUAL PROPERTIES  ////////////////////////////////////////

// Create a virtual property to determine is a product is out of stock based on the current quantity
productSchema.virtual("inStock").get(function() {
  return this.quantity > 0;
});

// Create a virtual populate to populate reviews on each product
productSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "product",
});

////////////////////////////////////////// MIDDLEWARES ////////////////////////////////////////

// Create a document middleware to create a slug for the product name
productSchema.pre("save", function(next) {
  this.slug = slugify(this.name);
  next();
});

// Create a pre save middleware to set the value of the secret product
productSchema.pre("save", function(next) {
  if (this.quality === "new") {
    this.secretProduct = true;
  }
  next();
});

// Create an aggregation middleware to remove the secret product from the aggregation
productSchema.pre("aggregate", function(next) {
  if (!this.pipeline()[0]["$geoNear"]) {
    this.pipeline().unshift({
      $match: { secretProduct: { $ne: true } },
    });
  } else {
    this.pipeline().splice(1, 0, {
      $match: { secretProduct: { $ne: true } },
    });
  }
  next();
});

// Create a query middleware to remove the secret product from the query
productSchema.pre(/^find/, function(next) {
  this.find({ secretProduct: { $ne: true } });
  next();
});

// Create a query middleware for populating the seller of our product
productSchema.pre(/^find/, function(next) {
  this.populate({
    path: "seller",
    select: "-__v -passwordChangedAt",
  });
  next();
});

////////////////////////////////////////// CREATE MODEL  ////////////////////////////////////////

// Create a product model
const Product = new mongoose.model("Product", productSchema);

////////////////////////////////////////// EXPORT MODEL  ////////////////////////////////////////

// Export the model to be used in other parts of our application
module.exports = Product;
