export const environment = {
  production: true,
  appName: 'MicroTrust',
  appVersion: '1.0.0',
  companyRUC: '20537570220',
  lenderAddress: '0x430B607db26DB81c563d76756f1a3806889221F7',
  // Dirección del Smart Contract (Red Hoodi Testnet)
  contractAddressHoodi: '0x18a311908B1e64015C89C492aDFd0AEF2EA7bE19',
  // Dirección del Smart Contract (Red Sepolia Mainnet)
  contractAddressSepolia: '0xa413E44f62470685b10C733448148845076EfD8e',
  adminAddresses: [
    '0x430B607db26DB81c563d76756f1a3806889221F7'
  ],
  networks: {
    goerli: { name: 'Goerli', limit: 20 },
    holesky: { name: 'Holešky', limit: 20 },
    sepolia: { name: 'Sepolia', limit: 5 },
    ephemery: { name: 'Ephemery', limit: 5 }
  },
  interestRates: {
    student: 0.05,  // 5%
    business: 0.10, // 10%
    other: 0.18     // 18%
  }
};