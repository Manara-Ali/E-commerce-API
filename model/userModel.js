///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import mongoose to be able to create a schema
const mongoose = require("mongoose");

// Import crypto to hash our reset token
const crypto = require("crypto");

// Import validator to help validate user email
const validator = require("validator");

// Import bcryptjs to help encrypt user passwords
const bcrypt = require("bcryptjs");

////////////////////////////////////// CREATE MODEL SCHEMA //////////////////////////////////////

// Create a schema for users
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Each user must have a name!"],
    unique: [true, `${this.name} already exist! Please try a different name.`],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Please choose a role between "user" or "seller".'],
    enum: {
      values: ["user", "seller"],
      message: 'Roles can only be "user" or "seller"!',
    },
  },
  rating: {
    type: Number,
  },
  ratingsQuantity: {
    type: Number,
  },
  email: {
    type: String,
    required: [true, "Each user must have an email address!"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(value) {
        return validator.isEmail(value);
      },
      message: "Please provide a valid email address!",
    },
  },
  photo: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    trim: true,
    minlength: 8,
    validate: {
      validator: function(value) {
        return value.length >= 8;
      },
      message: "Your password must be at least 8 characters long!",
    },
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password!"],
    validate: {
      validator: function(value) {
        return value === this.password;
      },
      message: "Passwords must match! Please try again.",
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetTokenExpirationDate: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

////////////////////////////////////// CREATE MODEL //////////////////////////////////////

// Create a middleware to encrypt user password
userSchema.pre("save", async function(next) {
  // If the password did not change, there is no need to encrypt it all over again
  if (!this.isModified("password")) {
    return next();
  }

  // Encrypt new user password with bcrypt
  this.password = await bcrypt.hash(this.password, 12);

  // Remove the password confirm from the database
  this.passwordConfirm = undefined;

  // Send back a response
  next();
});

// Create an instance method to compare passwords
userSchema.methods.comparePassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Create an instance method to verify that user password did not change after login
userSchema.methods.passwordChangedAfterLogin = function(JWTTimestamp) {
  // If there was a password change, verify that it was not after the user had already log in
  if (this.passwordChangedAt) {
    return JWTTimestamp < this.passwordChangedAt.getTime() / 1000;
  }
  return false;
};

// Create an instance method to generate a reset token
userSchema.methods.createPasswordResetToken = function() {
  // Create a reset token that will be sent to the user
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash the reset token to keep a copy of it inside of our database
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Update the passwordResetToken inside of our database
  this.passwordResetToken = hashedToken;

  // Update the passwordResetTokenExpirationDate inside our database
  this.passwordResetTokenExpirationDate = Date.now() + 10 * 60 * 1000;

  // Send back the token
  return resetToken;
};

// Create a pre save middleware to update the time user changed their password
userSchema.pre("save", function(next) {
  // Verify that the password was not changed or that the document is new
  if (!this.isModified("password") || this.isNew) {
    return next();
  }

  // Otherwise if the password was changed set up the passwordChangedAt variable
  this.passwordChangedAt = Date.now() - 1000;

  // Send back a response
  next();
});

// Create a query middleware to filter for active users only
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

// Create a document middleware that will add a rating field if the user is actually a seller
userSchema.pre("save", function(next) {
  if (this.role === "seller") {
    this.rating = 4.5;
    this.ratingsQuantity = 0;
  }
  next();
});

////////////////////////////////////// CREATE MODEL //////////////////////////////////////

// Create user model
const User = new mongoose.model("User", userSchema);

///////////////////////////////////////// EXPORT MODEL //////////////////////////////////////////

// Export model to be used in other parts of our application
module.exports = User;
