/**
 * Test user fixtures for different roles and permissions
 */

export const testUsers = {
  admin: {
    username: 'admin',
    password: 'password',  // Updated to match actual DB password
    role: 'admin',
    userType: 'local'
  },
  
  user: {
    username: 'testuser',
    password: 'user123',
    role: 'user',
    userType: 'local',
    permissions: ['inventory:ro']
  },
  
  inventoryManager: {
    username: 'invmanager',
    password: 'inv123',
    role: 'user',
    userType: 'local',
    permissions: ['inventory:rw']
  },
  
  procurementUser: {
    username: 'procuser',
    password: 'proc123',
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
