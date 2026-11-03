const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getPreviousMonthStart = (date) => new Date(date.getFullYear(), date.getMonth() - 1, 1);

const percentageChange = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
};

const formatActivity = (doc, type, text, userName = 'System') => ({
  id: String(doc._id),
  type,
  text,
  user: userName,
  createdAt: doc.createdAt,
});

const getAdminStats = catchAsync(async (req, res) => {
  const now = new Date();
  const thisMonthStart = getMonthStart(now);
  const previousMonthStart = getPreviousMonthStart(now);

  const [
    totalLeads,
    totalQuotations,
    totalTeamMembers,
    totalEmployees,
    totalHR,
    revenueRows,
    currentMonthLeads,
    previousMonthLeads,
    currentMonthQuotations,
    previousMonthQuotations,
    recentLeads,
    recentQuotations,
    recentInvoices,
    recentTeamMembers,
  ] = await Promise.all([
    Lead.countDocuments(),
    Quotation.countDocuments(),

    // Admin dashboard team total includes both HR and Employee accounts.
    User.countDocuments({ role: { $in: ['HR', 'Employee'] }, isActive: true }),
    User.countDocuments({ role: 'Employee', isActive: true }),
    User.countDocuments({ role: 'HR', isActive: true }),

    // Revenue card is based on the full value of invoices marked Sent.
    Invoice.aggregate([
      { $match: { status: 'Sent' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
    ]),
    Lead.countDocuments({ createdAt: { $gte: thisMonthStart } }),
    Lead.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: thisMonthStart } }),
    Quotation.countDocuments({ createdAt: { $gte: thisMonthStart } }),
    Quotation.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: thisMonthStart } }),
    Lead.find().sort({ createdAt: -1 }).limit(5)
      .populate('customer', 'name').populate('assignedTo', 'name'),
    Quotation.find().sort({ createdAt: -1 }).limit(5)
      .populate('customer', 'name').populate('createdBy', 'name'),
    Invoice.find().sort({ createdAt: -1 }).limit(5)
      .populate('customer', 'name').populate('createdBy', 'name'),
    User.find({ role: { $in: ['HR', 'Employee'] } }).sort({ createdAt: -1 }).limit(5)
      .select('name role createdAt'),
  ]);

  const activities = [
    ...recentLeads.map((lead) => formatActivity(
      lead, 'lead',
      `Lead created for ${lead.customer?.name || 'Unknown customer'}`,
      lead.assignedTo?.name || 'System',
    )),
    ...recentQuotations.map((quotation) => formatActivity(
      quotation, 'quotation',
      `Quotation ${quotation.estimateNo || ''} created for ${quotation.customer?.name || 'Unknown customer'}`.trim(),
      quotation.createdBy?.name || 'System',
    )),
    ...recentInvoices.map((invoice) => formatActivity(
      invoice, 'invoice',
      `Invoice ${invoice.invoiceNo || ''} created for ${invoice.customer?.name || 'Unknown customer'}`.trim(),
      invoice.createdBy?.name || 'System',
    )),
    ...recentTeamMembers.map((member) => formatActivity(
      member,
      member.role === 'HR' ? 'employee' : 'employee',
      `${member.role === 'HR' ? 'HR account' : 'Employee'} ${member.name} added`,
      'Admin',
    )),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((activity) => ({
      ...activity,
      time: new Date(activity.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

  const stats = {
    totalLeads,
    totalQuotations,
    totalTeamMembers,
    totalEmployees,
    totalHR,
    // Sent invoice value (not collected/paid revenue).
    totalSentRevenue: Number(revenueRows[0]?.total || 0),
    // Backward-compatible alias for older dashboard consumers.
    totalRevenue: Number(revenueRows[0]?.total || 0),
    monthly: {
      leads: {
        current: currentMonthLeads,
        previous: previousMonthLeads,
        changePercent: percentageChange(currentMonthLeads, previousMonthLeads),
      },
      quotations: {
        current: currentMonthQuotations,
        previous: previousMonthQuotations,
        changePercent: percentageChange(currentMonthQuotations, previousMonthQuotations),
      },
    },
    recentActivities: activities,
    generatedAt: now.toISOString(),
  };

  return res.status(200).json(
    new ApiResponse(200, stats, 'Dashboard stats fetched successfully'),
  );
});

const Task = require('../models/Task');
const Customer = require('../models/Customer');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

const getHRStats = catchAsync(async (req, res) => {
  const ownerHR = req.user._id;
  const [totalEmployees, totalLeads, totalCustomers, totalTasks, pendingTasks,
    pendingLeaves, attendanceToday, recentLeads] = await Promise.all([
    User.countDocuments({ role: 'Employee', $or: [{ reportingTo: ownerHR }, { createdBy: ownerHR }] }),
    Lead.countDocuments({ ownerHR }),
    Customer.countDocuments({ ownerHR }),
    Task.countDocuments({ ownerHR }),
    Task.countDocuments({ ownerHR, status: { $ne: 'Completed' } }),
    Leave.countDocuments({ ownerHR, status: 'Pending' }),
    Attendance.countDocuments({
      ownerHR,
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(24, 0, 0, 0)),
      },
    }),
    Lead.find({ ownerHR }).sort({ createdAt: -1 }).limit(5)
      .populate('customer', 'name mobile').populate('assignedTo', 'name'),
  ]);

  return res.status(200).json(new ApiResponse(200, {
    totalEmployees, totalLeads, totalCustomers, totalTasks, pendingTasks,
    pendingLeaves, attendanceToday, recentLeads, generatedAt: new Date().toISOString(),
  }, 'HR dashboard stats fetched successfully'));
});

module.exports = { getAdminStats, getHRStats };
