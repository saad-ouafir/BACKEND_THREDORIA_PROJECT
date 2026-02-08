const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");

// Config object with defaults for local development
const config = {
  APP_PORT: process.env.APP_PORT || 5000,

  // DB Credentials
  DB_HOST: process.env.DB_HOST || "10.0.3.3",
  DB_USER: process.env.DB_USER || "root",
  DB_PORT: process.env.DB_PORT || 3306,
  DB_NAME: process.env.DB_NAME || "threadoria",
  DB_PASSWORD: process.env.DB_PASSWORD || "",

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "",

  // GCP
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || "",
  GCP_BUCKET_NAME: process.env.GCP_BUCKET_NAME || "threadoria-app-bucket",
};

// Fetch secrets from GCP Secret Manager and update config
async function loadConfig() {
  // Skip Secret Manager if no project ID (local development)
  if (!config.GCP_PROJECT_ID) {
    console.log("GCP_PROJECT_ID not set — using environment variables only.");
    return;
  }

  try {
    const client = new SecretManagerServiceClient();

    // Fetch DB_PASSWORD
    if (!config.DB_PASSWORD) {
      try {
        const [version] = await client.accessSecretVersion({
          name: `projects/${config.GCP_PROJECT_ID}/secrets/DB_PASSWORD/versions/latest`,
        });
        config.DB_PASSWORD = version.payload.data.toString();
      } catch (err) {
        console.warn("Could not fetch DB_PASSWORD from Secret Manager:", err.message);
      }
    }

    // Fetch JWT_SECRET
    if (!config.JWT_SECRET) {
      try {
        const [version] = await client.accessSecretVersion({
          name: `projects/${config.GCP_PROJECT_ID}/secrets/JWT_SECRET/versions/latest`,
        });
        config.JWT_SECRET = version.payload.data.toString();
      } catch (err) {
        console.warn("Could not fetch JWT_SECRET from Secret Manager:", err.message);
      }
    }

    console.log("Configuration loaded from GCP Secret Manager.");
  } catch (err) {
    console.error("Failed to initialize Secret Manager client:", err.message);
  }
}

module.exports = config;
module.exports.loadConfig = loadConfig;
