/**
 * Test user fixtures for different roles and permissions
 */

export const testUsers = {
  admin: {
    username: 'admin',
    password: 'password',  // Updated to match actual DB password
    role: 'superadmin',
    userType: 'local'
  },
  
  user: {
    username: 'm123ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['inventory:ro']
  },
  
  inventoryManager: {
    username: 'm123rw',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['inventory:rw']
  },
  
  procurementUser: {
    username: 'p123ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:ro']
  }
};

export const testItems = {
  basic: {
    catalog_number: 'TEST-001',
    description: 'פריט בדיקה',
    manufacturer: 'יצרן בדיקה',
    location: 'מחסן א',
    current_stock: '10',
    serial: 'SN-TEST-001'
  },
  
  withoutSerial: {
    catalog_number: 'TEST-002',
    description: 'פריט ללא סריאלי',
    manufacturer: 'יצרן בדיקה',
    location: 'מחסן ב',
    current_stock: '5'
  }
};

/**
 * E2E-prefixed test data for admin tests — cleaned up after each suite
 */
export const adminTestData = {
  newUser: {
    username: 'E2E-ADMIN-user1',
    password: 'TestPass123',
    user_type: 'local',
    role: 'user',
    permissions: ['inventory:ro'],
    is_active: true,
  },
  newGroup: {
    name: 'E2E-ADMIN-group1',
    role: 'user',
    permissions: ['inventory:ro'],
    is_active: true,
  },
  PREFIX: 'E2E-ADMIN-',
};
