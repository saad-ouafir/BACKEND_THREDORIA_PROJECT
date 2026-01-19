const {
  DB_HOST,
  DB_PORT,
  DB_DATABASE,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
} = require("./config");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DATABASE,
  logging: false,
});

async function connectDataBase() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to database:", error);
  }
}

module.exports = { sequelize, connectDataBase };
// module.exports = connectDataBase;
