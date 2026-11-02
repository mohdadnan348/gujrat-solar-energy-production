const express = require('express');
const router = express.Router();
const { 
  createTask, 
  getTasks, 
  getTaskById, 
  updateTaskStatus, 
  reassignTask, 
  deleteTask 
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All routes require login
router.use(protect);

// Common Routes (Admin & Employee)
router.route('/')
  .get(getTasks)
  .post(authorize('Admin'), createTask); // Only Admin can create

router.route('/:id')
  .get(getTaskById)
  .delete(authorize('Admin'), deleteTask); // Only Admin can delete

router.route('/:id/status')
  .put(updateTaskStatus); // Both can update (Controller checks ownership)

// Admin Only Routes
router.route('/:id/reassign')
  .put(authorize('Admin'), reassignTask);

module.exports = router;