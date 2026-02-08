const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();

// Fetch a secret from GCP Secret Manager
async function getSecret(secretName) {
  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString();
  } catch (err) {
    console.error(`Error fetching secret ${secretName}:`, err);
    return null;
  }
}

// Config object — env var defaults are used until loadConfig() runs
const config = {
  APP_PORT: process.env.APP_PORT || 3000,

  // DB Credentials
  DB_HOST: process.env.DB_HOST || "10.0.3.3",
  DB_USER: process.env.DB_USER || "root",
  DB_PORT: process.env.DB_PORT || 3306,
  DB_NAME: process.env.DB_NAME || "threadoria",
  DB_PASSWORD: process.env.DB_PASSWORD || "",

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "",

  // GCP
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
};

// Fetch secrets from GCP and override config values
async function loadConfig() {
  const dbPassword = await getSecret("DB_PASSWORD");
  if (dbPassword) config.DB_PASSWORD = dbPassword;

  const jwtSecret = await getSecret("JWT_SECRET");
  if (jwtSecret) config.JWT_SECRET = jwtSecret;

  console.log("Configuration loaded (secrets fetched from GCP Secret Manager).");
}

module.exports = config;
module.exports.loadConfig = loadConfig;
