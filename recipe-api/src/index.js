require('dotenv').config();

const express       = require('express');
const cors = require("cors");
const listEndpoints = require('express-list-endpoints');
const connectDB     = require('./config/db');
const authRoutes    = require('./routes/auth');
const recipesRoutes = require('./routes/recipe');
const usersRoutes   = require('./routes/user');
// const commentRoutes = require('./routes/comment'); // now mounted via recipe routes

const app = express();
app.use(cors());
app.use(express.json());

// Root health check
app.get('/', (req, res) => res.send('🍔 Recipe API is running'));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/recipe', recipesRoutes);
app.use('/api/user', usersRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

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
