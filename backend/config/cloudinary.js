const cloudinary = require('cloudinary').v2;
const env = require('./env');

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY.CLOUD_NAME,
  api_key: env.CLOUDINARY.API_KEY,
  api_secret: env.CLOUDINARY.API_SECRET,
  secure: true
});

// Verify configuration
if (!env.CLOUDINARY.CLOUD_NAME) {
  console.warn('⚠️ Cloudinary credentials missing. Image uploads will fail.');
}

module.exports = cloudinary;