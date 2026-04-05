const Joi = require('joi');

const userSchema = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(255),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('viewer', 'analyst', 'admin').default('viewer'),
  }),
  update: Joi.object({
    name: Joi.string().min(2).max(255),
    email: Joi.string().email(),
    role: Joi.string().valid('viewer', 'analyst', 'admin'),
    status: Joi.string().valid('active', 'inactive'),
  }).min(1),
};

const recordSchema = {
  create: Joi.object({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('income', 'expense').required(),
    category: Joi.string().required().min(2).max(100),
    description: Joi.string().max(1000),
    transaction_date: Joi.date().required(),
  }),
  update: Joi.object({
    amount: Joi.number().positive(),
    type: Joi.string().valid('income', 'expense'),
    category: Joi.string().min(2).max(100),
    description: Joi.string().max(1000),
    transaction_date: Joi.date(),
  }).min(1),
};

const querySchema = {
  listRecords: Joi.object({
    startDate: Joi.date(),
    endDate: Joi.date(),
    category: Joi.string(),
    type: Joi.string().valid('income', 'expense'),
    limit: Joi.number().max(100).default(50),
    offset: Joi.number().default(0),
  }),
};

const authSchema = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

module.exports = {
  userSchema,
  recordSchema,
  querySchema,
  authSchema,
};
