import { findUser } from "../../utils/findUser";

class FollowRequest {
  static async followUser(req, res) {}

  static async unFollowUser(req, res) {}

  static async getFollowers(req, res) {}

  static async getFollowing(req, res) {}

  static async getFollowRequests(req, res) {}

  static async acceptFollowRequest(req, res) {}

  static async rejectFollowRequest(req, res) {}
}

module.exports = FollowRequest;
