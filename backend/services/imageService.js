const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Image par panels draw karne ka function
 * @param {String} baseImageName - Base image ka naam (e.g., 'roof-top-base.jpg')
 * @param {Number} panelCount - Kitne panels chahiye
 * @returns {String} - Nayi generated image ka path
 */
const generateRoofImage = async (baseImageName, panelCount) => {
  try {
    const baseImagePath = path.join(__dirname, '../public/images', baseImageName);
    const image = await loadImage(baseImagePath);

    // Canvas setup
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Base image draw karo
    ctx.drawImage(image, 0, 0, image.width, image.height);

    // --- DYNAMIC PANEL CALCULATION ---
    // Chalo panels ko grid me arrange karte hain (5 columns max)
    const panelsPerRow = 5;
    const totalRows = Math.ceil(panelCount / panelsPerRow);

    // Roof area define karo (image ke ratio me)
    // Ye values tumhari image ke hisaab se tune karni pad sakti hain
    const roofArea = {
      startX: image.width * 0.32,   // Roof ka left start
      startY: image.height * 0.22,  // Roof ka top start
      width: image.width * 0.6,     // Roof ka total width
      height: image.height * 0.55,  // Roof ka total height
    };

    // Panel ka size calculate karo (roof area aur grid ke hisaab se)
    const gapRatio = 0.15; // Har panel ke beech 15% gap
    const panelWidth = (roofArea.width / panelsPerRow) * (1 - gapRatio);
    const panelHeight = (roofArea.height / Math.max(totalRows, 1)) * (1 - gapRatio);
    const gapX = (roofArea.width - (panelWidth * panelsPerRow)) / (panelsPerRow + 1);
    const gapY = (roofArea.height - (panelHeight * totalRows)) / (totalRows + 1);

    // Har panel draw karo
    for (let i = 0; i < panelCount; i++) {
      const row = Math.floor(i / panelsPerRow);
      const col = i % panelsPerRow;

      const x = roofArea.startX + gapX + (col * (panelWidth + gapX));
      const y = roofArea.startY + gapY + (row * (panelHeight + gapY));

      // Panel ka shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 4, y + 4, panelWidth, panelHeight);

      // Panel ka base color (Dark Blue)
      ctx.fillStyle = '#1a2a6c'; 
      ctx.fillRect(x, y, panelWidth, panelHeight);
      
      // Panel ke border
      ctx.strokeStyle = '#8899bb';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, panelWidth, panelHeight);
      
      // Panel ke andar ki grid lines (solar cells)
      ctx.strokeStyle = '#4a5a8c';
      ctx.lineWidth = 1;
      
      // Vertical lines (3 columns of cells)
      for (let j = 1; j < 3; j++) {
        const lineX = x + (panelWidth / 3) * j;
        ctx.beginPath();
        ctx.moveTo(lineX, y);
        ctx.lineTo(lineX, y + panelHeight);
        ctx.stroke();
      }
      
      // Horizontal lines (4 rows of cells)
      for (let k = 1; k < 4; k++) {
        const lineY = y + (panelHeight / 4) * k;
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + panelWidth, lineY);
        ctx.stroke();
      }
    }

    // Final image ko buffer me convert karo
    const buffer = canvas.toBuffer('image/jpeg');
    
    // Nayi image ka unique naam
    const newFileName = `generated-roof-${Date.now()}.jpg`;
    const outputPath = path.join(__dirname, '../public/images', newFileName);
    
    // Public folder me save karo
    fs.writeFileSync(outputPath, buffer);
    
    return `/images/${newFileName}`;
  } catch (error) {
    console.error("Roof Image Generate Error:", error);
    throw error;
  }
};

module.exports = { generateRoofImage };