// 6. Create a filter function to only accept certain data from to user to be changed
exports.filterObj = (obj, ...args) => {
  // Create a new obj that will hold only the parameters we allow users to update
  const newObj = {};

  // Loop through the request body and filter only those parameters
  Object.keys(obj).forEach((element) => {
    if (args.includes(element)) {
      newObj[element] = obj[element];
    }
  });

  // // Make sure that the user can update only the fields they want
  Object.keys(newObj).forEach((element) => {
    if (!newObj[element] || newObj[element] === " ") {
      delete newObj[element];
    }
  });

  // Return the filtered object
  return newObj;
};
