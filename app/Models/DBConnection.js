const mongoose = require('mongoose');
const config = require('../ConfigFiles/config.json');

var dbConnection = {
  connectToDB: async function () {
    try {
      console.log("Called Database connection");

      await mongoose.connect(config.connectionString);

      console.log("MongoDB is connected successfully");
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      process.exit(1); // optional but recommended
    }
  }
};

module.exports = dbConnection;
