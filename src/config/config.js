const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();

// Function to fetch a secret by name
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

module.exports = async () => {
  return {
    APP_PORT: process.env.APP_PORT || 3000,
    // DB CREDENTIALS
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PORT: process.env.DB_PORT,
    DB_DATABASE: process.env.DB_DATABASE,
    DB_PASSWORD: await getSecret("DB_PASSWORD"),
    JWT_SECRET: await getSecret("JWT_SECRET"),
    GCP_PROJECT_ID: process.env.GCP_PROJECT_ID,
  };
};
