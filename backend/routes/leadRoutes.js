const express = require('express');
const router = express.Router();
const { 
  createLead, 
  getLeads, 
  getLeadById, // <-- Import me add karo
  updateLead, 
  assignLead 
} = require('../controllers/leadController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);

router.route('/')
  .post(createLead)
  .get(getLeads);

router.route('/:id')
  .get(getLeadById) // <-- Get by ID route
  .put(updateLead);

router.route('/:id/assign')
  .put(authorize('Admin'), assignLead);

module.exports = router;