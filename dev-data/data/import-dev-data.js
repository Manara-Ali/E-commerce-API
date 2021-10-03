// Import the File System to be able to read and write files into memory
const fs = require("fs");

// Import mongoose in order to be able to connect to a database
const mongoose = require("mongoose");

// Import the dotenv file to connect to our config.env file
const dotenv = require("dotenv");

// Import the product model
const Product = require("./../../model/productModel");

// Import the review model
const Review = require("./../../model/reviewModel");

// Import the User model
const User = require("./../../model/userModel");

// Connect to our config.env file
dotenv.config({
  path: `${__dirname}/../../config.env`,
});

// Lets read our product file into memory
const products = JSON.parse(
  fs.readFileSync(`${__dirname}/products.json`, "utf-8")
);

// Lets read our product file into memory
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

// Lets read our product file into memory
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));

// Create a variable that represent our database
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// Use mongoose to connect to the database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("DB is connected and ready to go!");
  })
  .catch((error) => {
    console.log(error, "🔥");
  });

// Create a function to delete everything inside of our database
const deleteDB = async () => {
  try {
    await Product.deleteMany();
    // await Review.deleteMany();
    // await User.deleteMany();
    console.log("Database deleted!");
    process.exit();
  } catch (error) {
    console.log(error, "💥");
  }
};

// Create a function to populate our database
const populateDB = async () => {
  try {
    await Product.create(products);
    // await Review.create(reviews);
    // await User.create(users);
    console.log("DB populated!");
    process.exit();
  } catch (error) {
    console.log(error, "💥");
  }
};

// Use conditional statement to either delete or populate the database
if (process.argv[2] === "--deleteDB") {
  deleteDB();
} else if (process.argv[2] === "--populateDB") {
  populateDB();
}
