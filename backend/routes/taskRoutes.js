const express = require('express');
const router = express.Router();
const {
  createTask, getTasks, getTaskById, updateTask, updateTaskStatus,
  reassignTask, deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

// Admin and HR can create/assign; Employee can only view own tasks.
router.route('/')
  .get(getTasks)
  .post(authorize('Admin', 'HR'), createTask);

router.route('/:id')
  .get(getTaskById)
  .put(authorize('Admin', 'HR'), updateTask)
  .delete(authorize('Admin', 'HR'), deleteTask);

router.route('/:id/status')
  .put(updateTaskStatus);

router.route('/:id/reassign')
  .put(authorize('Admin', 'HR'), reassignTask);

module.exports = router;
