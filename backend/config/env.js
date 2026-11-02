const dotenv = require('dotenv');

// Load .env file
dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quickestimate',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_key_change_this_in_production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  
  // Cloudinary (Optional - future use ke liye)
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  }
};

// Validation: Check if critical variables are present in production
if (env.NODE_ENV === 'production') {
  const requiredVars = ['MONGO_URI', 'JWT_SECRET'];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      console.error(`❌ FATAL ERROR: Missing required environment variable: ${varName}`);
      process.exit(1);
    }
  });
}

module.exports = env;