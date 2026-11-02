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
    totalEmployees,
    revenueRows,
    currentMonthLeads,
    previousMonthLeads,
    currentMonthQuotations,
    previousMonthQuotations,
    recentLeads,
    recentQuotations,
    recentInvoices,
    recentEmployees,
  ] = await Promise.all([
    Lead.countDocuments(),
    Quotation.countDocuments(),
    User.countDocuments({ role: 'Employee', isActive: true }),
    Invoice.aggregate([
      { $match: { status: 'Paid' } },
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
    User.find({ role: 'Employee' }).sort({ createdAt: -1 }).limit(5)
      .select('name createdAt'),
  ]);

  const activities = [
    ...recentLeads.map((lead) => formatActivity(
      lead,
      'lead',
      `Lead created for ${lead.customer?.name || 'Unknown customer'}`,
      lead.assignedTo?.name || 'System',
    )),
    ...recentQuotations.map((quotation) => formatActivity(
      quotation,
      'quotation',
      `Quotation ${quotation.estimateNo || ''} created for ${quotation.customer?.name || 'Unknown customer'}`.trim(),
      quotation.createdBy?.name || 'System',
    )),
    ...recentInvoices.map((invoice) => formatActivity(
      invoice,
      'invoice',
      `Invoice ${invoice.invoiceNo || ''} created for ${invoice.customer?.name || 'Unknown customer'}`.trim(),
      invoice.createdBy?.name || 'System',
    )),
    ...recentEmployees.map((employee) => formatActivity(
      employee,
      'employee',
      `Employee ${employee.name} added`,
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
    totalEmployees,
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

module.exports = { getAdminStats };
