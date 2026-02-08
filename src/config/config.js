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
// Optimized loadConfig for individual secrets
async function loadConfig() {
  if (!config.GCP_PROJECT_ID) return;

  const client = new SecretManagerServiceClient();
  const secretsToLoad = ["DB_PASSWORD", "JWT_SECRET"];

  for (const secretName of secretsToLoad) {
    try {
      const [version] = await client.accessSecretVersion({
        name: `projects/${config.GCP_PROJECT_ID}/secrets/${secretName}/versions/latest`,
      });
      config[secretName] = version.payload.data.toString().trim();
    } catch (err) {
      console.warn(`Could not fetch ${secretName}:`, err.message);
    }
  }
}

// Run loadConfig immediately and export the promise
const configReady = loadConfig();

module.exports = config;
module.exports.configReady = configReady;
