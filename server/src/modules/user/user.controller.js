const userService = require('./user.service')

const getProfile = async (req, res) => {
  try {
    const user = await userService.findUserById(req.user.id);
    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "User not found" })
  }
}
const getUserById = async (req, res) => {
  try {
    const user = await userService.findUserById(req.user.id);
    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "User not found" })
  }
}
const createUser = async (req, res) => {
  try {
    const { userDetails } = await req.body;
    const createUserDetails = await userService.createUser(userDetails);
    res.status(200).json({ message: "User Created Successfully" }, createUserDetails);
  } catch (error) {
    res.status(500).json({ message: "User Creation Issue" })
  }
}
module.exports = {
  getProfile,
  getUserById,
};