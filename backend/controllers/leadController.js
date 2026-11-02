const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// @desc    Create new lead
// @route   POST /api/leads
// @access  Private (Admin & Employee)
const createLead = catchAsync(async (req, res) => {
  const { customerId, source, interestedSystem, location, requirementNotes, assignedTo, followUpDate } = req.body;

  // Verify customer exists
  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json(new ApiResponse(404, null, 'Customer not found'));
  }

  const lead = await Lead.create({
    customer: customerId,
    source,
    interestedSystem,
    location,
    requirementNotes,
    assignedTo: assignedTo || req.user._id,
    followUpDate,
    createdBy: req.user._id,
    statusHistory: [{ status: 'New', updatedBy: req.user._id, note: 'Lead created' }]
  });

  res.status(201).json(new ApiResponse(201, lead, 'Lead created successfully'));
});

// @desc    Get all leads (Admin sees all, Employee sees assigned)
// @route   GET /api/leads
// @access  Private
const getLeads = catchAsync(async (req, res) => {
  let query = {};

  // Employee can only see assigned leads
  if (req.user.role === 'Employee') {
    query.assignedTo = req.user._id;
  }

  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  const leads = await Lead.find(query)
    .populate('customer', 'name mobile email city')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, leads, 'Leads fetched successfully'));
});

// @desc    Get single lead by ID (YEH FUNCTION MISSING THA!)
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = catchAsync(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('customer') // Customer ki poori details
    .populate('assignedTo', 'name email') // Employee ka naam
    .populate('createdBy', 'name'); // Kisne banaya

  if (!lead) {
    return res.status(404).json(new ApiResponse(404, null, 'Lead not found'));
  }

  res.status(200).json(new ApiResponse(200, lead, 'Lead fetched successfully'));
});

// @desc    Update lead status & follow-up
// @route   PUT /api/leads/:id
// @access  Private (Admin & assigned Employee)
const updateLead = catchAsync(async (req, res) => {
  let lead = await Lead.findById(req.params.id);

  if (!lead) {
    return res.status(404).json(new ApiResponse(404, null, 'Lead not found'));
  }

  // Employee can only update their assigned leads
  if (req.user.role === 'Employee' && lead.assignedTo.toString() !== req.user._id.toString()) {
    return res.status(403).json(new ApiResponse(403, null, 'Not authorized to update this lead'));
  }

  // If status is changing, add to history
  if (req.body.status && req.body.status !== lead.status) {
    lead.statusHistory.push({
      status: req.body.status,
      updatedBy: req.user._id,
      note: req.body.statusNote || `Status changed to ${req.body.status}`
    });
  }

  // Update fields
  lead.source = req.body.source || lead.source;
  lead.interestedSystem = req.body.interestedSystem || lead.interestedSystem;
  lead.location = req.body.location || lead.location;
  lead.requirementNotes = req.body.requirementNotes || lead.requirementNotes;
  lead.followUpDate = req.body.followUpDate || lead.followUpDate;
  lead.status = req.body.status || lead.status;

  const updatedLead = await lead.save();

  res.status(200).json(new ApiResponse(200, updatedLead, 'Lead updated successfully'));
});

// @desc    Assign/Reassign lead to an Employee
// @route   PUT /api/leads/:id/assign
// @access  Private (Admin only)
const assignLead = catchAsync(async (req, res) => {
  const { employeeId } = req.body;
  
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    return res.status(404).json(new ApiResponse(404, null, 'Lead not found'));
  }

  lead.assignedTo = employeeId;
  lead.statusHistory.push({
    status: lead.status,
    updatedBy: req.user._id,
    note: `Lead reassigned to employee ID: ${employeeId}`
  });

  await lead.save();
  res.status(200).json(new ApiResponse(200, lead, 'Lead assigned successfully'));
});

module.exports = {
  createLead,
  getLeads,
  getLeadById, // <-- YEH EXPORT ME BHI ADD KAR DIYA
  updateLead,
  assignLead,
};