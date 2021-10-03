// UNCAUGHT EXCEPTION
process.on("uncaughtException", (error) => {
  console.log("UNCAUGHT EXCEPTION");
  console.log(error.message);
  console.log("Server is shutting down... 🔥");
  process.exit(1);
});

///////////////////////////////////////// IMPORT MODULES ////////////////////////////////////////

// Import mongoose to be able to connect to the database
const mongoose = require("mongoose");

// Import our app server
const app = require("./app");
const ApplicationError = require("./utils/ApplicationError");

////////////////////////////////////// CONNECT TO DATABASE //////////////////////////////////////

// Create a variable to represent our database
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
    console.log("DB Connected!");
  })
  .catch((error) => {
    console.log(
      error.message
        .split(" ")
        .slice(10, 15)
        .join(" "),
      "💥"
    );
  });

// Provide a port for the servers to listen to requests and send responses
const port = 8000;

const server = app.listen(port, "localhost", () => {
  console.log(`Server started on port ${port}...`);
});

// UNHANDLED REJECTION
process.on("unhandledRejection", () => {
  console.log("UNHANDLED REJECTION");
  console.log("Server is shutting down... 🔥");
  server.close(() => {
    process.exit(1);
  });
});
