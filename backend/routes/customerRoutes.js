const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('Admin', 'HR', 'Employee'), createCustomer)
  .get(authorize('Admin', 'HR', 'Employee'), getCustomers);

router.route('/:id')
  .get(authorize('Admin', 'HR', 'Employee'), getCustomerById)
  .put(authorize('Admin', 'HR'), updateCustomer);

module.exports = router;
