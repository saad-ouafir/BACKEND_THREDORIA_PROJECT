/** -------------------------------------
 * LOCAL VERION
 * --------------------------------------
 */

// const config = require("./config");
// const { Storage } = require("@google-cloud/storage");

// const storage = new Storage({
//   projectId: config.GCP_PROJECT_ID,
//   credentials: {
//     client_email: config.GCP_CLIENT_MAIL,
//     private_key: Buffer.from(config.GCP_PRIVATE_KEY, "base64"),
//     type: "service_account",
//     project_id: config.GCP_PROJECT_ID,
//     client_x509_cert_url: config.GCP_x509_CERT_URL,
//   },
// });

// const bucket = storage.bucket(config.GCP_BUCKET_NAME);

// module.exports = {
//   storage,
//   bucket,
// };

const config = require("./config");
const { Storage } = require("@google-cloud/storage");

const storage = new Storage({
  projectId: config.GCP_PROJECT_ID,
  credentials: {
    project_id: config.GCP_PROJECT_ID,
  },
});

const bucket = storage.bucket(config.GCP_BUCKET_NAME);

module.exports = {
  storage,
  bucket,
};
