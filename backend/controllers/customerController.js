const Customer = require('../models/Customer');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const getOwnerHR = async (user) => {
  if (user.role === 'HR') return user._id;
  if (user.role !== 'Employee') return null;
  const refs = [user.hrManager, user.reportingTo, user.createdBy, user.ownerHR].filter(Boolean);
  if (!refs.length) return null;
  const hr = await User.findOne({ _id: { $in: refs }, role: 'HR' }).select('_id');
  return hr?._id || null;
};

const scopeFor = (user) => {
  if (user.role === 'Admin') return {};
  if (user.role === 'HR') return { ownerHR: user._id };
  return { createdBy: user._id };
};

const createCustomer = catchAsync(async (req, res) => {
  const { name, mobile, email, address, city, state, pincode, gstin, businessName } = req.body;
  if (!name?.trim() || !mobile?.trim()) {
    return res.status(400).json(new ApiResponse(400, null, 'Customer name and mobile are required'));
  }
  const existing = await Customer.findOne({ mobile: mobile.trim() });
  if (existing) {
    return res.status(400).json(new ApiResponse(400, existing, 'Customer with this mobile number already exists. Please select existing customer.'));
  }
  const ownerHR = await getOwnerHR(req.user);
  const customer = await Customer.create({
    name, mobile: mobile.trim(), email, address, city, state, pincode, gstin, businessName,
    createdBy: req.user._id,
    ownerHR: req.user.role === 'Admin' ? null : ownerHR,
  });
  res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully'));
});

const getCustomers = catchAsync(async (req, res) => {
  const search = String(req.query.search || '').trim();
  const keyword = search ? { $or: [
    { name: { $regex: search, $options: 'i' } },
    { mobile: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { businessName: { $regex: search, $options: 'i' } },
  ] } : {};
  const customers = await Customer.find({ ...keyword, ...scopeFor(req.user) }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, customers, 'Customers fetched successfully'));
});

const getCustomerById = catchAsync(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, ...scopeFor(req.user) });
  if (!customer) return res.status(404).json(new ApiResponse(404, null, 'Customer not found'));
  res.status(200).json(new ApiResponse(200, customer, 'Customer fetched successfully'));
});

const updateCustomer = catchAsync(async (req, res) => {
  const { createdBy, ownerHR, _id, role, ...safeUpdates } = req.body;
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, ...scopeFor(req.user) },
    safeUpdates,
    { new: true, runValidators: true }
  );
  if (!customer) return res.status(404).json(new ApiResponse(404, null, 'Customer not found or access denied'));
  res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully'));
});

module.exports = { createCustomer, getCustomers, getCustomerById, updateCustomer };
