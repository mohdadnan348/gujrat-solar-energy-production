const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const VALID_TYPES = [
  'Announcement',
  'Lead Assignment',
  'Task Assignment',
  'Leave Decision',
  'Payroll',
];

// POST /api/notifications — Admin sends to selected employees or all active employees
const sendNotification = catchAsync(async (req, res) => {
  const { title, message, type = 'Announcement', recipientIds = [] } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json(new ApiResponse(400, null, 'Notification title is required'));
  }
  if (!message || !String(message).trim()) {
    return res.status(400).json(new ApiResponse(400, null, 'Notification message is required'));
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid notification type'));
  }
  if (!Array.isArray(recipientIds)) {
    return res.status(400).json(new ApiResponse(400, null, 'recipientIds must be an array'));
  }

  let recipients;
  if (recipientIds.length > 0) {
    const invalidIds = recipientIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length) {
      return res.status(400).json(new ApiResponse(400, null, 'One or more recipient IDs are invalid'));
    }

    const users = await User.find({
      _id: { $in: recipientIds },
      role: 'Employee',
      isActive: true,
    }).select('_id');

    if (users.length !== new Set(recipientIds.map(String)).size) {
      return res.status(400).json(
        new ApiResponse(400, null, 'One or more recipients are not active employees'),
      );
    }
    recipients = users.map((user) => user._id);
  } else {
    const employees = await User.find({ role: 'Employee', isActive: true }).select('_id');
    recipients = employees.map((employee) => employee._id);
  }

  const notification = await Notification.create({
    title: String(title).trim(),
    message: String(message).trim(),
    type,
    recipients,
    readBy: [],
    sentBy: req.user._id,
  });

  const result = await Notification.findById(notification._id)
    .populate('recipients', 'name role')
    .populate('sentBy', 'name');

  return res.status(201).json(
    new ApiResponse(201, result, 'Notification sent successfully'),
  );
});

// GET /api/notifications/my — current user sees only notifications addressed to them
const getMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ recipients: req.user._id })
    .populate('sentBy', 'name')
    .sort({ createdAt: -1 });

  const userId = String(req.user._id);
  const unreadCount = notifications.filter(
    (notification) => !notification.readBy.some((id) => String(id) === userId),
  ).length;

  return res.status(200).json(
    new ApiResponse(200, { notifications, unreadCount }, 'Notifications fetched successfully'),
  );
});

// PUT /api/notifications/:id/read — recipient marks their notification as read
const markAsRead = catchAsync(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid notification ID'));
  }

  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json(new ApiResponse(404, null, 'Notification not found'));
  }

  const userId = String(req.user._id);
  const isRecipient = notification.recipients.some((id) => String(id) === userId);
  if (!isRecipient) {
    return res.status(403).json(
      new ApiResponse(403, null, 'You are not a recipient of this notification'),
    );
  }

  const alreadyRead = notification.readBy.some((id) => String(id) === userId);
  if (!alreadyRead) {
    notification.readBy.push(req.user._id);
    await notification.save();
  }

  return res.status(200).json(
    new ApiResponse(200, notification, 'Notification marked as read'),
  );
});

// GET /api/notifications/sent — Admin sent history
const getSentHistory = catchAsync(async (req, res) => {
  // Admin dashboard history is shared: show every notification sent by any Admin.
  // Filtering only by req.user._id can make older messages disappear after a
  // different Admin account/session is used.
  const notifications = await Notification.find({})
    .populate('recipients', 'name role')
    .populate('sentBy', 'name email')
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, notifications, 'Sent notifications history fetched'),
  );
});

// DELETE /api/notifications/:id — Admin deletes their own sent notification
const deleteNotification = catchAsync(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid notification ID'));
  }

  // This route is Admin-only, so Admin can manage/delete any notification
  // visible in the shared Admin sent-history list.
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    return res.status(404).json(
      new ApiResponse(404, null, 'Notification not found'),
    );
  }

  await notification.deleteOne();
  return res.status(200).json(
    new ApiResponse(200, null, 'Notification deleted successfully'),
  );
});

module.exports = {
  sendNotification,
  getMyNotifications,
  markAsRead,
  getSentHistory,
  deleteNotification,
};
