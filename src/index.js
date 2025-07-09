// src/index.js
require('dotenv').config();
const express   = require('express');
const connectDB = require('./config/db');

const app = express();
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('🍔 Recipe API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server listening on port ${PORT}`)
);
