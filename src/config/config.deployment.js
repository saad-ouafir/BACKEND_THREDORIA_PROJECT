const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();

async function loadConfig() {
  // Non-sensitive: standard env variables
  const config = {
    dbHost: process.env.DB_HOST || "localhost",
    dbName: process.env.DB_NAME || "threadoria",
    bucket: process.env.GCP_BUCKET_NAME,
  };

  // Sensitive: fetched from Secret Manager
  const [version] = await client.accessSecretVersion({
    name: `projects/${process.env.GCP_PROJECT_ID}/secrets/THREADORIA_DB_PASSWORD/versions/latest`,
  });

  config.dbPassword = version.payload.data.toString();
  return config;
}
