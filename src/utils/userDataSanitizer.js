function userDataSanitizer(data) {
  const {
    id,
    username,
    full_name,
    is_private,
    profile_picture_url,
    profile_metadata,
    bio,
  } = data;
  return {
    id,
    username,
    full_name,
    is_private,
    profile_picture_url,
    profile_metadata,
    bio,
  };
}

module.exports = { userDataSanitizer };
