require('dotenv').config();

const express       = require('express');
const cors = require("cors");
const path    = require('path');
const fs      = require('fs');
const listEndpoints = require('express-list-endpoints');
const connectDB     = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const authRoutes    = require('./routes/auth');
const recipesRoutes = require('./routes/recipe');
const usersRoutes   = require('./routes/user');

const app = express();

const AVATAR_DIR = path.join(__dirname, 'app/storage/avatar');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

// Root health check
app.get('/', (req, res) => res.send('🍔 Recipe API is running'));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/recipe', recipesRoutes);
app.use('/api/user', usersRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server when run directly
if (require.main === module) {
  connectDB()
    .then(() => {
      const PORT = process.env.PORT || 5500;
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        console.table(
          listEndpoints(app).map(ep => ({
            path:    ep.path,
            methods: ep.methods.join(', ')
          }))
        );
      });
    })
    .catch(err => {
      console.error('Failed to connect to DB:', err.message);
      process.exit(1);
    });
}

module.exports = app;
