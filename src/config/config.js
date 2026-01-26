const dotenv = require("dotenv").config();

module.exports = {
  APP_PORT: process.env.APP_PORT,
  FRONTEND_SERVER_URL: process.env.FRONTEND_SERVER_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
  GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME,
  GCP_CLIENT_MAIL: process.env.GCP_CLIENT_MAIL,
  GCP_PRIVATE_KEY: process.env.GCP_PRIVATE_KEY,
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
  GCP_x509_CERT_URL: process.env.GCP_x509_CERT_URL,
};
