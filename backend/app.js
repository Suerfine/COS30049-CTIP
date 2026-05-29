const express = require('express');
const app = express();
const sequelize = require('./src/config/Database');
require("./src/models"); // Ensure models are loaded and associations are set up
const { runSeeders } = require('./src/seeders');
const dotenv = require('dotenv');

dotenv.config();

app.use(express.json({ limit: "50mb" }));

// Import routes

async function startServer(){
    try{
      await sequelize.authenticate();
      console.log("Database connection has been established successfully.");

      await sequelize.sync({ alter: true });
      console.log("Database synchronized successfully.");

      await runSeeders();
      console.log("Seeders executed successfully.");

      app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT || 5000}`);
      });
    } catch (error) {
        console.error('Error occurred while starting the server:', error);
    }
}
startServer();