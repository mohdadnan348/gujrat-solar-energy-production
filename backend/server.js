const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

// Handle Uncaught Exceptions (jaise undefined variable ka use)
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Connect to Database
connectDB();

const PORT = env.PORT || 5000;

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Server running in ${env.NODE_ENV} mode`);
  console.log(`🌐 Listening on port: ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`=========================================`);
});

// Handle Unhandled Promise Rejections (jaise database connection fail hona)
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down gracefully...');
  console.log(err.name, err.message);
  
  // Server ko close karo pehle, phir process exit karo
  server.close(() => {
    process.exit(1);
  });
});

// Graceful Shutdown (Jab server manually band kiya jaye - Ctrl+C)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});