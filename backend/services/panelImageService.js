const fs = require('fs');
const path = require('path');

// Only manually supplied panel-count artwork is used. No image is generated.
const AVAILABLE_PANEL_COUNTS = new Set([3, 11, 12, 13, 14, 16, 17, 18, 19, 21]);

const getPanelImagePath = (panelCount) => {
  const count = Number(panelCount);
  if (!Number.isInteger(count) || !AVAILABLE_PANEL_COUNTS.has(count)) return '';

  const fileName = `${count}-panels.png`;
  const absolutePath = path.join(__dirname, '../public/images/panel-counts', fileName);
  return fs.existsSync(absolutePath) ? `/images/panel-counts/${fileName}` : '';
};

module.exports = { getPanelImagePath, AVAILABLE_PANEL_COUNTS };
