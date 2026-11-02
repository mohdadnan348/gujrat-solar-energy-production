const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const testImage = path.join(__dirname, 'public', 'images', 'testimonial-1.jpg');

async function test() {
  try {
    console.log("Original size:", fs.statSync(testImage).size, "bytes");
    
    const buffer = await sharp(testImage)
      .resize(600, null, { withoutEnlargement: true })
      .jpeg({ quality: 50 })
      .toBuffer();
    
    console.log("Compressed size:", buffer.length, "bytes");
    console.log("✅ Sharp working!");
  } catch (err) {
    console.error("❌ Sharp error:", err.message);
  }
}

test();