const dashboardService = require("./dashboard.service")
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await dashboardService.getDashboardData(userId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
}
module.exports = {
  getDashboard,
};