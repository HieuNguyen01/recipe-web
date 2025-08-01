// index.js
const express          = require('express');
const listEndpoints    = require('express-list-endpoints');
const connectDB        = require('./config/db');
const authRoutes       = require('./routes/auth');
const recipesRoutes    = require('./routes/recipe');
const usersRoutes      = require('./routes/user');
require('dotenv').config();

const app = express();
app.use(express.json());

// Root health check
app.get('/', (req, res) => 
  res.send('🍔 Recipe API is running')
);

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/recipe', recipesRoutes);
app.use('/api/user', usersRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// only start the server if this file is run directly
if (require.main === module) {
  connectDB()
    .then(() => {
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        
        // Log all registered endpoints
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
