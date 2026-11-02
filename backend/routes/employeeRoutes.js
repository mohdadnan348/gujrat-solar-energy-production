const express = require('express');
const router = express.Router();
const { getEmployees, createEmployee, updateEmployee, deactivateEmployee } = require('../controllers/employeeController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(authorize('Admin')); // Sirf Admin access kar sakta hai

router.route('/')
  .get(getEmployees)
  .post(createEmployee);

router.route('/:id')
  .put(updateEmployee)
  .delete(deactivateEmployee);

module.exports = router;