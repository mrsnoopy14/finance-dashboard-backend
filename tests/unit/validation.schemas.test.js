// Unit tests for Joi validation schemas
// No database required

const { userSchema, recordSchema, querySchema, authSchema } = require('../../src/validators/schemas');

describe('userSchema.create', () => {
  const validUser = {
    name: 'Shashi Shekhar',
    email: 'shashi@example.com',
    password: 'Secret123!',
    role: 'analyst',
  };

  test('accepts valid user data', () => {
    const { error } = userSchema.create.validate(validUser);
    expect(error).toBeUndefined();
  });

  test('rejects missing name', () => {
    const { error } = userSchema.create.validate({ ...validUser, name: undefined });
    expect(error).toBeDefined();
    expect(error.details[0].path).toContain('name');
  });

  test('rejects invalid email', () => {
    const { error } = userSchema.create.validate({ ...validUser, email: 'not-an-email' });
    expect(error).toBeDefined();
  });

  test('rejects password shorter than 6 characters', () => {
    const { error } = userSchema.create.validate({ ...validUser, password: '123' });
    expect(error).toBeDefined();
  });

  test('rejects invalid role value', () => {
    const { error } = userSchema.create.validate({ ...validUser, role: 'superadmin' });
    expect(error).toBeDefined();
  });

  test('defaults role to viewer when not provided', () => {
    const { value, error } = userSchema.create.validate({ ...validUser, role: undefined });
    expect(error).toBeUndefined();
    expect(value.role).toBe('viewer');
  });
});

describe('recordSchema.create', () => {
  const validRecord = {
    amount: 1500.00,
    type: 'income',
    category: 'Salary',
    transaction_date: '2024-01-15',
  };

  test('accepts valid record data', () => {
    const { error } = recordSchema.create.validate(validRecord);
    expect(error).toBeUndefined();
  });

  test('rejects negative amount', () => {
    const { error } = recordSchema.create.validate({ ...validRecord, amount: -100 });
    expect(error).toBeDefined();
  });

  test('rejects zero amount', () => {
    const { error } = recordSchema.create.validate({ ...validRecord, amount: 0 });
    expect(error).toBeDefined();
  });

  test('rejects invalid type (not income/expense)', () => {
    const { error } = recordSchema.create.validate({ ...validRecord, type: 'transfer' });
    expect(error).toBeDefined();
  });

  test('rejects missing required fields', () => {
    const { error } = recordSchema.create.validate({ amount: 100 });
    expect(error).toBeDefined();
  });

  test('accepts optional description field', () => {
    const { error } = recordSchema.create.validate({
      ...validRecord,
      description: 'Monthly salary payment',
    });
    expect(error).toBeUndefined();
  });
});

describe('authSchema.login', () => {
  test('accepts valid email and password', () => {
    const { error } = authSchema.login.validate({ email: 'a@b.com', password: 'pass123' });
    expect(error).toBeUndefined();
  });

  test('rejects missing password', () => {
    const { error } = authSchema.login.validate({ email: 'a@b.com' });
    expect(error).toBeDefined();
  });

  test('rejects invalid email format', () => {
    const { error } = authSchema.login.validate({ email: 'not-email', password: 'pass123' });
    expect(error).toBeDefined();
  });
});

describe('querySchema.listRecords', () => {
  test('accepts valid query parameters', () => {
    const { error } = querySchema.listRecords.validate({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      type: 'income',
      limit: 10,
      offset: 0,
    });
    expect(error).toBeUndefined();
  });

  test('rejects invalid type in query', () => {
    const { error } = querySchema.listRecords.validate({ type: 'transfer' });
    expect(error).toBeDefined();
  });

  test('rejects limit exceeding 100', () => {
    const { error } = querySchema.listRecords.validate({ limit: 200 });
    expect(error).toBeDefined();
  });
});
