const { where } = require("sequelize");
const { User } = require("../../models/index");
import { findUser } from "../../utils/findUser";

class ProfileController {
  static async getProfiles(req, res) {
    const users = await User.findAll();
    return res.status(200).json({ users });
  }

  static async getProfilebyID(req, res) {
    const { id } = req.params;
    const user = await findUser(req, res, id);
    // if(user.is_private)===true{
    // Private Account Logic Here
    // }
    return res.status(200).json({ user });
  }
}

module.exports = ProfileController;
