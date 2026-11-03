const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const idOf = (value) => String(value?._id || value || '');

const getEmployeeOwnerHR = (employee) => {
  const owner = employee.hrManager || employee.reportingTo || employee.ownerHR || employee.createdBy;
  return owner && owner.role !== 'Admin' ? owner : null;
};

const leadScope = (user) => {
  if (user.role === 'Admin') return {};
  if (user.role === 'HR') return { ownerHR: user._id };
  return { assignedTo: user._id };
};

const ensureEmployeeInHRTeam = async (employeeId, hrId) => {
  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== 'Employee') return null;
  const owner = getEmployeeOwnerHR(employee);
  if (!owner || idOf(owner) !== idOf(hrId)) return null;
  return employee;
};

// @route POST /api/leads
const createLead = catchAsync(async (req, res) => {
  const { customerId, source, interestedSystem, location, requirementNotes, assignedTo, followUpDate, status } = req.body;

  if (!customerId || !source) {
    return res.status(400).json(new ApiResponse(400, null, 'Customer and lead source are required'));
  }

  const customerQuery = req.user.role === 'Admin'
    ? { _id: customerId }
    : req.user.role === 'HR'
      ? { _id: customerId, ownerHR: req.user._id }
      : { _id: customerId, createdBy: req.user._id };

  const customer = await Customer.findOne(customerQuery);
  if (!customer) {
    return res.status(404).json(new ApiResponse(404, null, 'Customer not found in your access scope'));
  }

  let employee = null;
  let ownerHR = null;
  if (req.user.role === 'HR') {
    const targetId = assignedTo || req.user._id;
    employee = await ensureEmployeeInHRTeam(targetId, req.user._id);
    if (!employee) return res.status(403).json(new ApiResponse(403, null, 'You can assign leads only to employees in your team'));
    ownerHR = req.user._id;
  } else if (req.user.role === 'Employee') {
    if (assignedTo && idOf(assignedTo) !== idOf(req.user._id)) {
      return res.status(403).json(new ApiResponse(403, null, 'Employees can only assign leads to themselves'));
    }
    employee = req.user;
    ownerHR = null;
  } else if (assignedTo) {
    employee = await User.findOne({ _id: assignedTo, role: 'Employee' });
    if (!employee) return res.status(404).json(new ApiResponse(404, null, 'Assigned employee not found'));
    const owner = getEmployeeOwnerHR(employee);
    ownerHR = owner ? owner._id || owner : null;
  }

  const lead = await Lead.create({
    customer: customer._id,
    source,
    interestedSystem,
    location,
    requirementNotes,
    status: status || 'New',
    assignedTo: employee?._id || req.user._id,
    createdBy: req.user._id,
    ownerHR,
    followUpDate: followUpDate || undefined,
    statusHistory: [{ status: status || 'New', updatedBy: req.user._id, note: 'Lead created' }]
  });

  const result = await Lead.findById(lead._id)
    .populate('customer', 'name mobile email city state')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name role');

  res.status(201).json(new ApiResponse(201, result, 'Lead created successfully'));
});

// @route GET /api/leads
const getLeads = catchAsync(async (req, res) => {
  const query = leadScope(req.user);
  if (req.query.status) query.status = req.query.status;
  if (req.query.assignedTo && req.user.role !== 'Employee') query.assignedTo = req.query.assignedTo;

  const leads = await Lead.find(query)
    .populate('customer', 'name mobile email city state')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, leads, 'Leads fetched successfully'));
});

// @route GET /api/leads/:id
const getLeadById = catchAsync(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...leadScope(req.user) })
    .populate('customer')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name role')
    .populate('statusHistory.updatedBy', 'name role');

  if (!lead) return res.status(404).json(new ApiResponse(404, null, 'Lead not found'));
  res.status(200).json(new ApiResponse(200, lead, 'Lead fetched successfully'));
});

// @route PUT /api/leads/:id
const updateLead = catchAsync(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...leadScope(req.user) });
  if (!lead) return res.status(404).json(new ApiResponse(404, null, 'Lead not found'));

  const { source, interestedSystem, location, requirementNotes, followUpDate, status, statusNote, assignedTo } = req.body;

  if (assignedTo && idOf(assignedTo) !== idOf(lead.assignedTo)) {
    if (req.user.role === 'Employee') {
      return res.status(403).json(new ApiResponse(403, null, 'Employees cannot reassign leads'));
    }
    if (req.user.role === 'HR') {
      const employee = await ensureEmployeeInHRTeam(assignedTo, req.user._id);
      if (!employee) return res.status(403).json(new ApiResponse(403, null, 'You can assign leads only to employees in your team'));
      lead.assignedTo = employee._id;
      lead.ownerHR = req.user._id;
    } else {
      const employee = await User.findOne({ _id: assignedTo, role: 'Employee' });
      if (!employee) return res.status(404).json(new ApiResponse(404, null, 'Assigned employee not found'));
      lead.assignedTo = employee._id;
      const owner = getEmployeeOwnerHR(employee);
      lead.ownerHR = owner ? owner._id || owner : null;
    }
  }

  if (source !== undefined) lead.source = source;
  if (interestedSystem !== undefined) lead.interestedSystem = interestedSystem;
  if (location !== undefined) lead.location = location;
  if (requirementNotes !== undefined) lead.requirementNotes = requirementNotes;
  if (followUpDate !== undefined) lead.followUpDate = followUpDate || null;

  if (status && status !== lead.status) {
    lead.status = status;
    lead.statusHistory.push({
      status,
      updatedBy: req.user._id,
      note: statusNote || `Status changed to ${status}`
    });
  }

  await lead.save();
  const result = await Lead.findById(lead._id)
    .populate('customer', 'name mobile email city state')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name role');
  res.status(200).json(new ApiResponse(200, result, 'Lead updated successfully'));
});

// @route PUT /api/leads/:id/assign
const assignLead = catchAsync(async (req, res) => {
  const { employeeId } = req.body;
  const lead = await Lead.findOne({ _id: req.params.id, ...leadScope(req.user) });
  if (!lead) return res.status(404).json(new ApiResponse(404, null, 'Lead not found'));

  let employee;
  if (req.user.role === 'HR') {
    employee = await ensureEmployeeInHRTeam(employeeId, req.user._id);
    if (!employee) return res.status(403).json(new ApiResponse(403, null, 'You can assign leads only within your team'));
    lead.ownerHR = req.user._id;
  } else {
    employee = await User.findOne({ _id: employeeId, role: 'Employee' });
    if (!employee) return res.status(404).json(new ApiResponse(404, null, 'Employee not found'));
    const owner = getEmployeeOwnerHR(employee);
    lead.ownerHR = owner ? owner._id || owner : null;
  }

  lead.assignedTo = employee._id;
  lead.statusHistory.push({ status: lead.status, updatedBy: req.user._id, note: `Lead assigned to ${employee.name}` });
  await lead.save();
  res.status(200).json(new ApiResponse(200, lead, 'Lead assigned successfully'));
});

// @route DELETE /api/leads/:id
const deleteLead = catchAsync(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, ...leadScope(req.user) });
  if (!lead) return res.status(404).json(new ApiResponse(404, null, 'Lead not found'));
  if (req.user.role === 'Employee') return res.status(403).json(new ApiResponse(403, null, 'Employees cannot delete leads'));
  await lead.deleteOne();
  res.status(200).json(new ApiResponse(200, null, 'Lead deleted successfully'));
});

module.exports = { createLead, getLeads, getLeadById, updateLead, assignLead, deleteLead };
