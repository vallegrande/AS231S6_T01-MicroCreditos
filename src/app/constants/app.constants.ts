export const APP_CONSTANTS = {
  COMPANY_NAME: 'MicroTrust',
  COMPANY_RUC: '20537570220',
  LENDER_ADDRESS: '0x430B607db26DB81c563d76756f1a3806889221F7',
  ADMIN_ADDRESSES: [
    '0xC7F4f019c6e41a6601166f311D51a3321eb06D7b', // Victor Cuaresma
    '0x231a92048f79B3316A6cF73E70cbE2b809187Ee4'  // Ronaldinho Ccencho Ramos
  ],
  NETWORKS: {
    GOERLI: { name: 'Goerli', value: 'goerli', limit: 3 },
    HOLESKY: { name: 'Holešky', value: 'holesky', limit: 10 },
    SEPOLIA: { name: 'Sepolia', value: 'sepolia', limit: 5 },
    EPHEMERY: { name: 'Ephemery', value: 'ephemery', limit: 3 },
    HOODI:{ name: 'Hoodi', value:'hoodi', limit: 5}
  },
  PURPOSE_TYPES: {
    STUDENT: { value: 'student', label: 'Soy Estudiante', interestRate: 0.12 }, // 5% + 7% = 12%
    BUSINESS: { value: 'business', label: 'Tengo un negocio', interestRate: 0.17 }, // 10% + 7% = 17%
    HEALTH: { value: 'health', label: 'Salud', interestRate: 0.15 }, // 8% + 7% = 15%
    EVENTS: { value: 'events', label: 'Eventos', interestRate: 0.20 }, // 13% + 7% = 20%
    OTHER: { value: 'other', label: 'Otro propósito', interestRate: 0.25 } // 18% + 7% = 25%
  },
  LOAN_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    DISBURSED: 'disbursed',
    PAYMENT_PENDING: 'payment_pending',
    PAID: 'paid'
  },
  LOAN_STATUS_LABELS: {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    disbursed: 'Desembolsado',
    payment_pending: 'Pago Pendiente',
    paid: 'Pagado'
  },
  PURPOSE_TYPE_LABELS: {
    student: 'Estudiante',
    business: 'Negocio',
    health: 'Salud',
    events: 'Eventos',
    other: 'Otro'
  },
  NETWORK_LABELS: {
    goerli: 'Goerli',
    holesky: 'Holešky',
    sepolia: 'Sepolia',
    ephemery: 'Ephemery',
    hoodi: 'Hoodi'
  }
};