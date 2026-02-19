const userService = require('./user.service')

const getProfile = async(req,res)=>{
  try {
    const user = await userService.findUserById(req.user.id);
    res.json(user);

  } catch (error) {
    res.status(500).json({message:"User not found"})
  }
}
const getUserById = async(req,res)=>{
  try {
    const user = await userService.findUserById(req.user.id);
    res.json(user);

  } catch (error) {
    res.status(500).json({message:"User not found"})
  }
}
module.exports = {
  getProfile,
  getUserById,
};