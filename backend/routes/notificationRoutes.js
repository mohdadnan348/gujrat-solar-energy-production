const express = require('express');
const router = express.Router();

const {
  sendNotification,
  getMyNotifications,
  markAsRead,
  getSentHistory,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

// Current user's inbox and read status
router.get('/my', getMyNotifications);
router.put('/:id/read', markAsRead);

// Admin-only sending, history and delete
router.post('/', authorize('Admin'), sendNotification);
router.get('/sent', authorize('Admin'), getSentHistory);
router.delete('/:id', authorize('Admin'), deleteNotification);

module.exports = router;
