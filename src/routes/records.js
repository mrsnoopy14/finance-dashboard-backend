const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { validateRequest, validateQuery } = require('../middleware/validation');
const { authorizeRoles } = require('../middleware/auth');
const { recordSchema, querySchema } = require('../validators/schemas');

// Create record (analyst or admin)
router.post(
  '/',
  authorizeRoles(['analyst', 'admin']),
  validateRequest(recordSchema.create),
  recordController.createRecord
);

// Get records (analyst or admin can get their own, admin can get others)
router.get(
  '/',
  authorizeRoles(['analyst', 'admin']),
  validateQuery(querySchema.listRecords),
  recordController.getRecords
);

// Get specific record (analyst or admin)
router.get(
  '/:recordId',
  authorizeRoles(['analyst', 'admin']),
  recordController.getRecord
);

// Update record (analyst or admin)
router.put(
  '/:recordId',
  authorizeRoles(['analyst', 'admin']),
  validateRequest(recordSchema.update),
  recordController.updateRecord
);

// Delete record (analyst or admin)
router.delete(
  '/:recordId',
  authorizeRoles(['analyst', 'admin']),
  recordController.deleteRecord
);

module.exports = router;
