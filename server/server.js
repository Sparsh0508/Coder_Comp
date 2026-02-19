const app = require('./app')
const dotenv = require("dotenv")
dotenv.config();

const PORT = process.evn.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Is Running On PORT ${PORT}`);

})