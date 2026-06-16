process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jwt';
process.env.JWT_EXPIRE = '7d';

// Mock des services externes
jest.mock('../src/services/emailService', () => ({
  sendInvoiceEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../src/services/pushService', () => ({
  sendNotificationToUser: jest.fn().mockResolvedValue({ success: true }),
  saveSubscription: jest.fn().mockResolvedValue({}),
  deleteSubscription: jest.fn().mockResolvedValue({})
}));