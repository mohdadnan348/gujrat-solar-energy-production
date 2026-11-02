// Roles
const ROLES = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

// Lead Stages (As per Functional Plan)
const LEAD_STATUS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  SITE_VISIT: 'Site Visit',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

// Quotation Lifecycle
const QUOTATION_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
};

// Invoice Statuses
const INVOICE_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

// Task Statuses
const TASK_STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
};

// Attendance Statuses
const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half-Day',
  LATE: 'Late',
  WEEKLY_OFF: 'Weekly Off',
  HOLIDAY: 'Holiday',
  PAID_LEAVE: 'Paid Leave',
  UNPAID_LEAVE: 'Unpaid Leave',
};

module.exports = {
  ROLES,
  LEAD_STATUS,
  QUOTATION_STATUS,
  INVOICE_STATUS,
  TASK_STATUS,
  ATTENDANCE_STATUS,
};