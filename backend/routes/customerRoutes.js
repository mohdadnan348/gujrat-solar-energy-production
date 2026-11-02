const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomerById, updateCustomer } = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All customer routes require login
router.use(protect);

router.route('/')
  .post(createCustomer) // Both Admin & Employee can create (inline)
  .get(getCustomers);

router.route('/:id')
  .get(getCustomerById)
  .put(authorize('Admin'), updateCustomer); // Only Admin can edit master record

module.exports = router;