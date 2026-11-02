const Customer = require('../models/Customer');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private (Admin & Employee can create inline)
const createCustomer = catchAsync(async (req, res) => {
  const { name, mobile, email, address, city, state, pincode, gstin, businessName } = req.body;

  // Check for possible duplicates based on mobile
  const existingCustomer = await Customer.findOne({ mobile });
  if (existingCustomer) {
    return res.status(400).json(new ApiResponse(400, existingCustomer, 'Customer with this mobile number already exists. Please select existing customer.'));
  }

  const customer = await Customer.create({
    name, mobile, email, address, city, state, pincode, gstin, businessName,
    createdBy: req.user._id
  });

  res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully'));
});

// @desc    Get all customers (with search)
// @route   GET /api/customers
// @access  Private (Admin sees all, Employee sees allowed - for now all)
const getCustomers = catchAsync(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { mobile: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  const customers = await Customer.find({ ...keyword }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, customers, 'Customers fetched successfully'));
});

// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = catchAsync(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json(new ApiResponse(404, null, 'Customer not found'));
  }
  res.status(200).json(new ApiResponse(200, customer, 'Customer fetched successfully'));
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Admin only as per plan, but allowing for now)
const updateCustomer = catchAsync(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) {
    return res.status(404).json(new ApiResponse(404, null, 'Customer not found'));
  }
  res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully'));
});

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
};