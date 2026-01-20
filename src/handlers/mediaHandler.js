const { v4: uuidv4 } = require("uuid");
const { bucket } = require("../config/google.cdn");

async function UploadHandler(files, userID) {
  try {
    const uploadedUrls = [];
    const fileArray = Array.isArray(files) ? files : [files];
    for (const file of fileArray) {
      if (!file || !file.buffer) {
        throw new Error("Invalid file object");
      }
      const fileName = `${uuidv4()}.${file.originalname.split(".").pop()}`;
      const blob = bucket.file(`${userID}/${fileName}`);
      await blob.save(file.buffer, {
        resumable: false,
        contentType: file.mimetype,
      });

      const fileUrl = `https://storage.googleapis.com/${bucket.name}/${userID}/${fileName}`;
      uploadedUrls.push(fileUrl);
    }
    return Array.isArray(files) ? uploadedUrls : uploadedUrls[0];
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

async function DeleteHandler(fileUrls, userID) {
  try {
    const urlArray = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
    const deletionPromises = urlArray.map(async url => {
      if (!url || typeof url !== "string") return;
      const fileName = url.split("https://storage.googleapis.com/").pop().split("/").pop();
      if (fileName) {
        const blob = bucket.file(`${userID}/${fileName}`);

        return blob.delete().catch(err => {
          if (err.code !== 404) {
            console.warn(`Failed to delete ${fileName}:`, err.message);
          }
        });
      }
    });
    await Promise.all(deletionPromises);

    return true;
  } catch (error) {
    console.error("Error while deleting media:", error);
    throw error;
  }
}

module.exports = { UploadHandler, DeleteHandler };
