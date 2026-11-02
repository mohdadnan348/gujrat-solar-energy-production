const Settings = require('../models/Settings');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const getSettings = catchAsync(async (req, res) => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({});
  }

  return res
    .status(200)
    .json(new ApiResponse(200, settings, 'Settings fetched successfully'));
});

const updateSettings = catchAsync(async (req, res) => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = new Settings();
  }

  // Only accept fields managed by the Settings screen. ownerName was
  // present in the UI/schema but missing from the old allow-list.
  const scalarFields = [
    'companyName',
    'ownerName',
    'gstin',
    'address',
    'mobile',
    'email',
    'website',
    'logoUrl',
  ];

  scalarFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  // Merge nested objects so omitted keys are not accidentally erased.
  const nestedFields = ['bankDetails', 'terms', 'payrollRules'];
  nestedFields.forEach((field) => {
    if (req.body[field] && typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
      const current = settings[field]?.toObject
        ? settings[field].toObject()
        : (settings[field] || {});
      settings[field] = { ...current, ...req.body[field] };
    }
  });

  await settings.save();

  return res
    .status(200)
    .json(new ApiResponse(200, settings, 'Settings updated successfully'));
});

module.exports = {
  getSettings,
  updateSettings,
};
