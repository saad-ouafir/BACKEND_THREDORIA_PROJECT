const { Op } = require("sequelize");
const { User } = require("../models/index");

const findUser = async (res, param, message) => {
  const user = await User.findOne({
    where: { [Op.or]: { id: param, email: param, username: param } },
  });
  if (!user) {
    res.status(401).json({ message: message || "User does not exist !" });
    return;
  }
  return user;
};

module.exports = { findUser };
