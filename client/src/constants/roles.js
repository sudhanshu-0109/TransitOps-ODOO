// ─── Role Names ──────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'ADMIN',
  FLEET_MANAGER: 'FLEET_MANAGER',
  DISPATCHER: 'DISPATCHER',
  SAFETY_OFFICER: 'SAFETY_OFFICER',
  FINANCIAL_ANALYST: 'FINANCIAL_ANALYST',
};

// ─── Status Enums ────────────────────────────────────────────────────────────
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  IN_SHOP: 'IN_SHOP',
  RETIRED: 'RETIRED',
};

export const DRIVER_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  OFF_DUTY: 'OFF_DUTY',
  SUSPENDED: 'SUSPENDED',
};

export const TRIP_STATUS = {
  DRAFT: 'DRAFT',
  DISPATCHED: 'DISPATCHED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const MAINTENANCE_STATUS = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
};

export const EXPENSE_TYPES = [
  { value: 'FUEL', label: 'Fuel' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'TOLL', label: 'Toll' },
  { value: 'MISC', label: 'Miscellaneous' },
];

export const VEHICLE_TYPES = [
  { value: 'Van', label: 'Van' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Mini', label: 'Mini' },
  { value: 'Bus', label: 'Bus' },
  { value: 'Tanker', label: 'Tanker' },
];

export const DRIVER_CATEGORIES = [
  { value: 'LMV', label: 'LMV (Light Motor Vehicle)' },
  { value: 'HMV', label: 'HMV (Heavy Motor Vehicle)' },
];

export const MAINTENANCE_TYPES = [
  'Oil Change',
  'Engine Repair',
  'Tyre Replace',
  'Brake Service',
  'Battery Replace',
  'Transmission',
  'AC Repair',
  'General Service',
  'Other',
];

// ─── RBAC Permission Map ─────────────────────────────────────────────────────
export const RBAC_MAP = {
  dashboard:      [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
  fleet:          [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST],
  drivers:        [ROLES.ADMIN, ROLES.SAFETY_OFFICER, ROLES.DISPATCHER],
  trips:          [ROLES.ADMIN, ROLES.DISPATCHER, ROLES.FINANCIAL_ANALYST],
  maintenance:    [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  'fuel-expenses': [ROLES.ADMIN, ROLES.FINANCIAL_ANALYST],
  analytics:      [ROLES.ADMIN, ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
  settings:       [ROLES.ADMIN],
};

// ─── Write Permission Roles (CRUD, not just view) ────────────────────────────
export const WRITE_ROLES = {
  fleet:          [ROLES.ADMIN, ROLES.FLEET_MANAGER],
  drivers:        [ROLES.ADMIN, ROLES.SAFETY_OFFICER],
  trips:          [ROLES.ADMIN, ROLES.DISPATCHER],
  maintenance:    [ROLES.ADMIN, ROLES.FLEET_MANAGER],
  'fuel-expenses': [ROLES.ADMIN, ROLES.FINANCIAL_ANALYST],
};
