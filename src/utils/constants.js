// ===================
// CATEGORY DEFINITIONS
// ===================

export const CATEGORIES = {
  UNCATEGORIZED: 'UNCATEGORIZED',
  IN_STOCK: 'IN_STOCK',
  SPU_PENDING: 'SPU_PENDING',
  SPU_CLEARED: 'SPU_CLEARED',
  AMC: 'AMC',
  OG: 'OG',
  RETURN: 'RETURN',
  RECEIVED_FOR_OTHERS: 'RECEIVED_FOR_OTHERS'
};

export const CATEGORY_CONFIG = {
  [CATEGORIES.IN_STOCK]: {
    label: 'In Stock',
    badgeClass: 'badge-in-stock',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800'
  },
  [CATEGORIES.SPU_PENDING]: {
    label: 'SPU Pending',
    badgeClass: 'badge-spu-pending',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
    textColor: 'text-red-800'
  },
  [CATEGORIES.SPU_CLEARED]: {
    label: 'SPU Cleared',
    badgeClass: 'badge-spu-cleared',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
    textColor: 'text-green-800'
  },
  [CATEGORIES.AMC]: {
    label: 'AMC',
    badgeClass: 'badge-amc',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-800'
  },
  [CATEGORIES.OG]: {
    label: 'OG (Out of Guarantee)',
    badgeClass: 'badge-og',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-800'
  },
  [CATEGORIES.RETURN]: {
    label: 'Return',
    badgeClass: 'badge-return',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800'
  },
  [CATEGORIES.RECEIVED_FOR_OTHERS]: {
    label: 'Received for Others',
    badgeClass: 'badge-received-others',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-500',
    textColor: 'text-gray-800'
  },
  [CATEGORIES.UNCATEGORIZED]: {
    label: 'Uncategorized',
    badgeClass: 'badge-uncategorized',
    bgColor: 'bg-white',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-600'
  }
};

// ===================
// USER ROLES
// ===================

export const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.OPERATOR]: 'Operator',
  [ROLES.VIEWER]: 'Viewer'
};

// ===================
// PAYMENT STATUS
// ===================

export const PAYMENT_STATUS = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  WAIVED: 'WAIVED'
};

export const PAYMENT_MODES = {
  CASH: 'CASH',
  CHEQUE: 'CHEQUE',
  ONLINE: 'ONLINE',
  UPI: 'UPI'
};