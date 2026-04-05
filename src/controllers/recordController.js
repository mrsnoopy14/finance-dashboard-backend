const FinancialRecord = require('../models/FinancialRecord');

// Create a new financial record
const createRecord = async (req, res) => {
  try {
    const { amount, type, category, description, transaction_date } = req.validatedData;
    const userId = req.user.id;

    const record = await FinancialRecord.createRecord(
      userId,
      amount,
      type,
      category,
      description,
      transaction_date
    );

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating record',
      error: error.message,
    });
  }
};

// Get a specific record
const getRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const record = await FinancialRecord.getRecordById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found',
      });
    }

    // Check ownership for non-admin users
    if (req.user.role !== 'admin' && record.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own records',
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching record',
      error: error.message,
    });
  }
};

// Get user's records with filters
const getRecords = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const filters = req.validatedQuery;

    // Check ownership for non-admin users
    if (req.user.role !== 'admin' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own records',
      });
    }

    const records = await FinancialRecord.getUserRecords(userId, filters);
    const count = await FinancialRecord.getRecordCount(userId);

    res.json({
      success: true,
      data: records,
      pagination: {
        total: count,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching records',
      error: error.message,
    });
  }
};

// Update a record
const updateRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;

    const record = await FinancialRecord.updateRecord(recordId, userId, req.validatedData);

    res.json({
      success: true,
      message: 'Record updated successfully',
      data: record,
    });
  } catch (error) {
    if (error.message === 'Record not found or unauthorized') {
      return res.status(404).json({
        success: false,
        message: 'Record not found or unauthorized',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error updating record',
      error: error.message,
    });
  }
};

// Delete a record
const deleteRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;

    await FinancialRecord.deleteRecord(recordId, userId);

    res.json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    if (error.message === 'Record not found or unauthorized') {
      return res.status(404).json({
        success: false,
        message: 'Record not found or unauthorized',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error deleting record',
      error: error.message,
    });
  }
};

module.exports = {
  createRecord,
  getRecord,
  getRecords,
  updateRecord,
  deleteRecord,
};
