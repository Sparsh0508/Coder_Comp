const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const problemRoutes = require('./routes/problemRoutes');
const app = express();
app.use(cors());
app.use(express.json());

app.use('/problems', problemRoutes);
module.exports = app;
