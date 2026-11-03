const express = require('express');
const router = express.Router();
const {
  createLead, getLeads, getLeadById, updateLead, assignLead, deleteLead
} = require('../controllers/leadController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('Admin', 'HR', 'Employee'), createLead)
  .get(getLeads);

router.route('/:id')
  .get(getLeadById)
  .put(authorize('Admin', 'HR', 'Employee'), updateLead)
  .delete(authorize('Admin', 'HR'), deleteLead);

router.route('/:id/assign')
  .put(authorize('Admin', 'HR'), assignLead);

module.exports = router;
