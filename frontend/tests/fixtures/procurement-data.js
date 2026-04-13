/**
 * Test data fixtures for procurement E2E tests
 */

export const procurementTestUsers = {
  admin: {
    username: 'admin',
    password: 'password',
    role: 'superadmin',
    userType: 'local',
  },
  procurementReadOnly: {
    username: 'p123ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:ro'],
  },
  // Alias used by permissions spec
  p123ro: {
    username: 'p123ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:ro'],
  },
  procurementReadWrite: {
    username: 'p123rw',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:rw'],
  },
  // ── Vendor-specific: NetApp ────────────────────────────
  netappRo: {
    username: 'netapp_ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:netapp:ro'],
  },
  netappRw: {
    username: 'netapp_rw',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:netapp:rw'],
  },
  // ── Vendor-specific: Dell ──────────────────────────────
  dellRo: {
    username: 'dell_ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:dell:ro'],
  },
  dellRw: {
    username: 'dell_rw',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:dell:rw'],
  },
  // ── Vendor-specific: HPE ───────────────────────────────
  hpeRo: {
    username: 'hpe_ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:hpe:ro'],
  },
  hpeRw: {
    username: 'hpe_rw',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:hpe:rw'],
  },
  // ── Vendor-specific: Cisco ─────────────────────────────
  ciscoRo: {
    username: 'cisco_ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:cisco:ro'],
  },
  ciscoRw: {
    username: 'cisco_rw',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:cisco:rw'],
  },
  // ── Vendor-specific: Commvault ─────────────────────────
  commvaultRo: {
    username: 'commvault_ro',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:commvault:ro'],
  },
  commvaultRw: {
    username: 'commvault_rw',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:commvault:rw'],
  },
  // ── Price permissions ──────────────────────────────────
  priceViewer: {
    username: 'price_viewer',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:ro', 'procurement:view_prices'],
  },
  priceComparer: {
    username: 'price_comparer',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:ro', 'procurement:view_prices', 'procurement:compare_prices'],
  },
  // ── Multi-vendor ───────────────────────────────────────
  multiVendorRw: {
    username: 'multi_vendor_rw',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['procurement:netapp:rw', 'procurement:dell:rw', 'procurement:view_prices'],
  },
  // ── No procurement access ──────────────────────────────
  inventoryOnly: {
    username: 'inventory_only',
    password: 'password',
    role: 'user',
    userType: 'local',
    permissions: ['inventory:rw'],
  },
};

export const testOrders = {
  manual: {
    order_date: new Date().toISOString(),
    bom_items: [
      {
        item_id: 1,
        catalog_number: 'E2E-PROC-001',
        manufacturer: 'Test Vendor',
        quantity: 5,
        description: 'E2E Test Item',
      },
    ],
    total_amount: 1000,
    status: 'waiting_bom_emf',
    emf_number: '',
    received_bom: false,
    bom_vendor: '',
  },

  withEmf: {
    order_date: new Date().toISOString(),
    bom_items: [
      {
        item_id: 1,
        catalog_number: 'E2E-PROC-002',
        manufacturer: 'Test Vendor',
        quantity: 3,
        description: 'E2E EMF Item',
      },
    ],
    total_amount: 2500,
    status: 'waiting_bom_emf',
    emf_number: 'EMF-E2E-001',
    received_bom: false,
    bom_vendor: 'NETAPP',
  },

  readyToShip: {
    order_date: new Date().toISOString(),
    bom_items: [
      {
        item_id: 1,
        catalog_number: 'E2E-PROC-003',
        manufacturer: 'Test Vendor',
        quantity: 10,
        description: 'E2E Ship Item',
      },
    ],
    total_amount: 5000,
    status: 'waiting_shipment',
    emf_number: 'EMF-E2E-002',
    received_bom: true,
    bom_vendor: 'NETAPP',
  },
};
