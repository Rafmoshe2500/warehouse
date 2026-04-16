import {
  FiPieChart, FiPackage, FiClock, FiActivity,
  FiShoppingCart, FiCheckCircle, FiLayers, FiTrendingUp,
  FiUsers, FiCpu, FiHelpCircle, FiLayout, FiArchive, FiClipboard,
  FiSettings, FiZap, FiBox
} from 'react-icons/fi';
import { FaBoxOpen } from 'react-icons/fa';

/**
 * Centralized navigation configuration.
 * Each item can have optional `permission` (function name on auth context)
 * and `children` for sub-navigation (replaces page-level tabs).
 */
const navigationConfig = [
  {
    id: 'dashboard',
    label: 'דשבורד',
    icon: FiPieChart,
    path: '/dashboard',
  },
  {
    id: 'inventory',
    label: 'מלאי',
    icon: FiPackage,
    path: '/inventory',
    permission: 'inventory:ro',
    children: [
      { id: 'current', label: 'מלאי נוכחי', icon: FiPackage, tabParam: 'current' },
      { id: 'stale', label: 'מלאי ישן', icon: FiClock, tabParam: 'stale' },
      { id: 'catalog', label: 'קטלוג פריטים', icon: FiPackage, tabParam: 'catalog' },
      { id: 'logs', label: 'תנועות', icon: FiActivity, tabParam: 'logs' },
    ],
  },
  {
    id: 'my-components',
    label: 'המלאי שלי',
    icon: FaBoxOpen,
    path: '/my-components',
  },
  {
    id: 'procurement',
    label: 'ניהול רכש',
    icon: FiShoppingCart,
    path: '/procurement',
    permission: 'procurement',
    children: [
      { id: 'orders', label: 'הזמנות', icon: FiShoppingCart, tabParam: 'orders' },
      { id: 'bom-netapp', label: 'סריקת BOM', icon: FiLayers, tabParam: 'bom-netapp' },
      { id: 'analytics', label: 'השוואת מחירים', icon: FiTrendingUp, tabParam: 'analytics', permission: 'compare_prices' },
    ],
  },
  {
    id: 'admin',
    label: 'ניהול',
    icon: FiUsers,
    path: '/admin',
    permission: 'admin',
    children: [
      { id: 'users', label: 'ניהול משתמשים וקבוצות', icon: FiUsers, tabParam: 'users' },
      { id: 'audit-logs', label: 'לוגים', icon: FiActivity, tabParam: 'logs' },
      { id: 'ai', label: 'כלי AI', icon: FiCpu, tabParam: 'ai', permission: 'superAdmin' },
    ],
  },
  {
    id: 'guide',
    label: 'מדריך',
    icon: FiHelpCircle,
    path: '/guide',
    children: [
      { id: 'guide-overview', label: 'סקירה וניווט', icon: FiBox, path: '/guide' },
      { id: 'guide-interface', label: 'ממשק וטבלאות', icon: FiLayout, path: '/guide/interface', permission: 'inventory:ro' },
      { id: 'guide-collections', label: 'המלאי שלי', icon: FiLayers, path: '/guide/collections', permission: 'inventory:ro' },
      { id: 'guide-dashboard', label: 'דשבורד', icon: FiPieChart, path: '/guide/dashboard' },
      { id: 'guide-stale', label: 'פריטים ישנים', icon: FiArchive, path: '/guide/stale-items', permission: 'inventory:ro' },
      { id: 'guide-audit', label: 'יומן פעילות', icon: FiClipboard, path: '/guide/audit-logs' },
      { id: 'guide-admin', label: 'ניהול מערכת', icon: FiSettings, path: '/guide/admin', permission: 'admin' },
      { id: 'guide-procurement', label: 'רכש והצטיידות', icon: FiShoppingCart, path: '/guide/procurement', permission: 'procurement' },
      { id: 'guide-tips', label: 'טיפים ו-FAQ', icon: FiZap, path: '/guide/tips' },
    ],
  },
];

export default navigationConfig;
