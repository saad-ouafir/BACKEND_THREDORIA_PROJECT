function userDataSanitizer(data) {
  const {
    id,
    username,
    full_name,
    is_private,
    profile_picture_url,
    profile_metadata,
    bio,
    follower_count,
    following_count,
    created_at,
  } = data;
  return {
    id,
    username,
    full_name,
    is_private,
    profile_picture_url,
    profile_metadata,
    bio,
    follower_count,
    following_count,
    created_at,
  };
}

module.exports = { userDataSanitizer };
