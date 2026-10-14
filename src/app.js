require('dotenv').config({ override: true });
const express = require('express');

const subRouter = require('./src-api-subscriber/subRouter');
const usageRouter = require('./src-api-usage-subscriber/usageRouter');

const app = express();

// CORS middleware for frontend communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Huawei Subscriber Management API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount application routers
app.use('/api/subscribers', subRouter);
app.use('/api/usage-subscribers', usageRouter);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 8085;

if (require.main === module) {
  const { initUsageCron } = require('./cron/usageCron');
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // Start cron jobs for scheduled CSV export
    initUsageCron();
  });
}

module.exports = app;
