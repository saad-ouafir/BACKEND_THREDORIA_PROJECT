const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = require("./config");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  logging: false,
});

async function connectDataBase() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    // Sync all models - creates tables if they don't exist
    await sequelize.sync({ alter: true });
    console.log("Database tables synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

module.exports = { sequelize, connectDataBase };
// module.exports = connectDataBase;
