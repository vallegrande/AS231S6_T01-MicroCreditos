# 🏦 MicroTrust - Sistema de Microcréditos Blockchain

Sistema descentralizado de microcréditos construido con Angular y Smart Contracts en Ethereum, diseñado para facilitar préstamos transparentes y seguros mediante tecnología blockchain.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Smart Contract](#-smart-contract)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API y Servicios](#-api-y-servicios)
- [Despliegue](#-despliegue)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## ✨ Características

### Para Usuarios (Prestatarios)
- 🔐 Conexión segura con MetaMask
- 💰 Solicitud de préstamos con diferentes propósitos
- 📊 Visualización de préstamos activos y historial
- 💳 Pago de préstamos con intereses calculados automáticamente
- 📄 Generación automática de contratos en PDF
- 🎓 Tasas preferenciales para estudiantes verificados

### Para Administradores
- ✅ Aprobación/rechazo de préstamos en blockchain
- 📈 Dashboard con estadísticas en tiempo real
- 🔍 Filtrado avanzado por estado y red
- 📝 Gestión de motivos de rechazo
- 🌐 Soporte multi-red (Holesky, Sepolia, etc.)

### Características Técnicas
- ⛓️ Integración completa con blockchain Ethereum
- 🔄 Sincronización automática con smart contracts
- 🎨 Diseño responsivo (móvil, tablet, desktop)
- 🌓 Modo oscuro/claro
- 🔔 Sistema de notificaciones en tiempo real
- 📱 PWA-ready (Progressive Web App)


## 🛠️ Tecnologías

### Frontend
- **Angular 17** - Framework principal
- **TypeScript** - Lenguaje de programación
- **RxJS** - Programación reactiva
- **SweetAlert2** - Alertas y modales elegantes
- **CSS3** - Estilos personalizados con variables CSS

### Blockchain
- **Solidity 0.8.19** - Lenguaje de smart contracts
- **Ethers.js 6.x** - Librería de interacción con Ethereum
- **MetaMask** - Wallet de Ethereum
- **Hardhat** - Framework de desarrollo blockchain

### Redes Soportadas
- **Holesky Testnet** (Chain ID: 17000)
- **Sepolia Testnet** (Chain ID: 11155111)
- **Goerli Testnet** (Chain ID: 5)
- **Ephemery Testnet** (Chain ID: 420)

## 📦 Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Angular CLI** >= 17.x
- **MetaMask** (extensión de navegador)
- **Git**

### Instalación de Herramientas

```bash
# Instalar Node.js (desde https://nodejs.org/)

# Instalar Angular CLI
npm install -g @angular/cli

# Verificar instalaciones
node --version
npm --version
ng version
```


## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/microtrust.git
cd microtrust
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Editar `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  contractAddress: '0xTU_DIRECCION_DEL_CONTRATO',
  networkId: 17000, // Holesky
  networkName: 'Holesky'
};
```

### 4. Iniciar el Servidor de Desarrollo

```bash
ng serve
```

Navegar a `http://localhost:4200/`

## ⚙️ Configuración

### Configurar MetaMask

1. **Instalar MetaMask**: https://metamask.io/
2. **Agregar Red Holesky**:
   - Network Name: `Holesky`
   - RPC URL: `https://ethereum-holesky.publicnode.com`
   - Chain ID: `17000`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://holesky.etherscan.io`

3. **Obtener ETH de Prueba**:
   - https://holesky-faucet.pk910.de/
   - https://cloud.google.com/application/web3/faucet/ethereum/holesky


## 📜 Smart Contract

### Contrato: MicroLoan

Ubicación: `MicroLoan_Final.sol`

#### Características del Contrato

- ✅ Solicitud de préstamos on-chain
- ✅ Aprobación/rechazo por administradores
- ✅ Transferencia automática de fondos
- ✅ Cálculo de intereses
- ✅ Sistema de pagos
- ✅ Gestión de administradores
- ✅ Eventos para tracking

#### Funciones Principales

```solidity
// Solicitar préstamo
function requestLoan(
    uint256 amount,
    uint256 rate,
    uint256 duration,
    string calldata purpose,
    string calldata purposeType
) external returns (uint256)

// Aprobar préstamo (solo admins)
function approveLoan(uint256 loanId) external payable onlyAdmin

// Rechazar préstamo (solo admins)
function rejectLoan(uint256 loanId, string calldata reason) external onlyAdmin

// Pagar préstamo
function payLoan(uint256 loanId) external payable

// Verificar si es admin
function isAdmin(address addr) external view returns (bool)
```


### Desplegar Smart Contract

#### Opción 1: Remix IDE (Recomendado)

1. **Abrir Remix**: https://remix.ethereum.org/
2. **Crear archivo**: `MicroLoan.sol`
3. **Copiar código**: De `MicroLoan_Final.sol`
4. **Configurar compilador**:
   - Versión: 0.8.19
   - Optimization: Enabled (200 runs)
   - Via-IR: Enabled (si es necesario)
5. **Compilar**: Clic en "Compile MicroLoan.sol"
6. **Desplegar**:
   - Environment: Injected Provider - MetaMask
   - Network: Holesky
   - Clic en "Deploy"
7. **Copiar dirección** del contrato desplegado
8. **Actualizar** `environment.ts` con la nueva dirección

Ver guía completa: `REMIX_CONFIGURACION.md`

#### Opción 2: Hardhat

```bash
# Compilar
npx hardhat compile

# Desplegar en Holesky
npx hardhat run scripts/deploy.js --network holesky
```

### Administradores Pre-configurados

El contrato incluye automáticamente estos administradores:

```solidity
0xC7F4f019c6e41a6601166f311D51a3321eb06D7b  // Victor Cuaresma
0x231a92048f79B3316A6cF73E70cbE2b809187Ee4  // Ronaldinho Ccencho
```


## 💻 Uso

### Para Usuarios

#### 1. Conectar Wallet
```
1. Abrir la aplicación
2. Clic en "Conectar Wallet"
3. Aprobar conexión en MetaMask
4. Verificar que estés en la red correcta
```

#### 2. Solicitar Préstamo
```
1. Ir a "Solicitar Préstamo"
2. Llenar el formulario:
   - Nombre completo
   - Monto (ETH)
   - Propósito
   - Tipo de propósito
   - Duración
   - Red blockchain
3. Revisar resumen
4. Confirmar transacción en MetaMask
5. Esperar confirmación
```

#### 3. Ver Mis Préstamos
```
1. Ir a "Mis Préstamos"
2. Ver lista de préstamos
3. Filtrar por estado o red
4. Ver detalles de cada préstamo
```

#### 4. Pagar Préstamo
```
1. En "Mis Préstamos"
2. Seleccionar préstamo aprobado
3. Clic en "Pagar Préstamo"
4. Confirmar monto total (principal + interés)
5. Confirmar transacción en MetaMask
```


### Para Administradores

#### 1. Acceder al Panel
```
1. Conectar con cuenta de administrador
2. Ir a "Panel de Administrador"
3. Ver dashboard con estadísticas
```

#### 2. Aprobar Préstamo
```
1. Ver lista de préstamos pendientes
2. Revisar detalles del préstamo
3. Clic en "Aprobar"
4. Confirmar transacción en MetaMask
5. Los fondos se transfieren automáticamente al prestatario
```

#### 3. Rechazar Préstamo
```
1. Seleccionar préstamo pendiente
2. Clic en "Rechazar"
3. Ingresar motivo del rechazo
4. Confirmar
```

#### 4. Filtrar y Buscar
```
- Filtrar por estado: Pendiente, Aprobado, Rechazado, Pagado
- Filtrar por red: Holesky, Sepolia, etc.
- Buscar por ID, nombre o dirección
```

## 📁 Estructura del Proyecto

```
microtrust/
├── src/
│   ├── app/
│   │   ├── components/          # Componentes reutilizables
│   │   │   ├── navbar/
│   │   │   └── footer/
│   │   ├── pages/               # Páginas principales
│   │   │   ├── admin/           # Panel de administrador
│   │   │   ├── loan-request/    # Solicitud de préstamo
│   │   │   ├── my-loans/        # Mis préstamos
│   │   │   └── login/           # Login con wallet
│   │   ├── services/            # Servicios Angular
│   │   │   ├── wallet.service.ts
│   │   │   ├── smart-contract.service.ts
│   │   │   ├── loan/
│   │   │   └── contract/
│   │   ├── guards/              # Guards de rutas
│   │   ├── interfaces/          # Interfaces TypeScript
│   │   ├── constants/           # Constantes de la app
│   │   └── contracts/           # ABIs de contratos
│   ├── environments/            # Configuración de entornos
│   ├── assets/                  # Recursos estáticos
│   └── styles.css              # Estilos globales
├── scripts/                     # Scripts de despliegue
├── MicroLoan_Final.sol         # Smart Contract optimizado
├── REMIX_CONFIGURACION.md      # Guía de despliegue
├── hardhat.config.js           # Configuración Hardhat
├── package.json
└── README.md
```


## 🔌 API y Servicios

### WalletService
Gestión de conexión con MetaMask

```typescript
// Conectar wallet
connect(): Promise<string>

// Obtener cuentas
getAccounts(): Promise<string[]>

// Obtener Chain ID
getChainId(): Promise<string>

// Cambiar red
switchNetwork(network: string): Promise<void>
```

### SmartContractService
Interacción con el smart contract

```typescript
// Solicitar préstamo
requestLoan(amount, rate, duration, purpose, purposeType): Promise<Result>

// Aprobar préstamo
approveLoan(loanId, amount): Promise<Result>

// Rechazar préstamo
rejectLoan(loanId, reason): Promise<Result>

// Pagar préstamo
payLoan(loanId, totalAmount): Promise<Result>

// Obtener préstamo
getLoan(loanId): Promise<LoanData>

// Verificar admin
isAdmin(address): Promise<boolean>
```

### LoanService
Gestión local de préstamos

```typescript
// Crear préstamo
createLoanRequest(request): LoanRequest

// Obtener todos los préstamos
getAllLoans(): LoanRequest[]

// Obtener préstamos por prestatario
getLoansByBorrower(address): LoanRequest[]

// Aprobar préstamo
approveLoan(loanId, adminAddress): Promise<Result>

// Rechazar préstamo
rejectLoan(loanId, adminAddress, reason): boolean

// Pagar préstamo
payLoan(loanId, borrowerAddress): Promise<Result>
```


## 🎨 Características de Diseño

### Responsive Design
- ✅ Desktop (> 1024px)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)

### Temas
- 🌙 Modo Oscuro (por defecto)
- ☀️ Modo Claro

### Componentes UI
- Alertas profesionales con SweetAlert2
- Modales personalizados
- Formularios validados
- Tarjetas de préstamos
- Dashboard con estadísticas
- Filtros avanzados
- Notificaciones en tiempo real

## 🚢 Despliegue

### Producción

```bash
# Build para producción
ng build --configuration production

# Los archivos se generan en dist/
```

### Desplegar en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Desplegar en Netlify

```bash
# Build
ng build --configuration production

# Arrastrar carpeta dist/ a Netlify
```

### Variables de Entorno en Producción

Actualizar `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  contractAddress: '0xTU_CONTRATO_EN_MAINNET',
  networkId: 1, // Mainnet
  networkName: 'Ethereum Mainnet'
};
```


## 🧪 Testing

### Ejecutar Tests

```bash
# Tests unitarios
ng test

# Tests e2e
ng e2e

# Coverage
ng test --code-coverage
```

### Probar en Testnet

1. Obtener ETH de prueba del faucet
2. Conectar MetaMask a Holesky
3. Solicitar un préstamo de prueba
4. Aprobar desde cuenta de administrador
5. Verificar transacción en Etherscan

## 🔒 Seguridad

### Smart Contract
- ✅ Modificadores de acceso (onlyOwner, onlyAdmin)
- ✅ Validación de parámetros
- ✅ Protección contra reentrancy
- ✅ Manejo seguro de transferencias
- ✅ Eventos para auditoría

### Frontend
- ✅ Validación de formularios
- ✅ Sanitización de inputs
- ✅ Verificación de red
- ✅ Manejo de errores
- ✅ Timeouts de transacciones

### Mejores Prácticas
- No almacenar private keys
- Verificar siempre la red antes de transacciones
- Validar montos y direcciones
- Usar HTTPS en producción
- Auditar smart contracts antes de mainnet


## 📊 Tasas de Interés

| Tipo de Préstamo | Tasa de Interés | Descripción |
|------------------|-----------------|-------------|
| 🎓 Estudiante | 12% | Para estudiantes verificados |
| 💼 Negocio | 17% | Para emprendimientos |
| 🏥 Salud | 15% | Para gastos médicos |
| 🎉 Eventos | 20% | Para eventos especiales |
| 📌 Otro | 25% | Propósito general |

### Descuentos por Pago Rápido
- 7 días: 2.5% de descuento
- 15 días: 3% de descuento

## 🌐 Redes Soportadas

| Red | Chain ID | RPC URL | Explorer |
|-----|----------|---------|----------|
| Holesky | 17000 | https://ethereum-holesky.publicnode.com | https://holesky.etherscan.io |
| Sepolia | 11155111 | https://ethereum-sepolia.publicnode.com | https://sepolia.etherscan.io |
| Goerli | 5 | https://goerli.infura.io/v3/YOUR-KEY | https://goerli.etherscan.io |

## 🐛 Troubleshooting

### Error: "MetaMask no está instalado"
**Solución**: Instalar MetaMask desde https://metamask.io/

### Error: "Red incorrecta"
**Solución**: Cambiar a Holesky en MetaMask

### Error: "Insufficient funds"
**Solución**: Obtener ETH de prueba del faucet

### Error: "Transaction failed"
**Solución**: 
- Verificar balance de gas
- Aumentar gas limit
- Verificar que el préstamo esté en estado correcto

### Error: "Solo administradores pueden ejecutar esta función"
**Solución**: Verificar que tu dirección esté agregada como admin en el contrato


## 🤝 Contribuir

### Cómo Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

### Guías de Estilo

- Usar TypeScript strict mode
- Seguir Angular style guide
- Comentar código complejo
- Escribir tests para nuevas features
- Actualizar documentación

## 📝 Changelog

### v1.0.0 (2025-11-18)
- ✅ Integración completa con blockchain
- ✅ Smart contract optimizado
- ✅ Panel de administrador
- ✅ Sistema de préstamos completo
- ✅ Diseño responsivo
- ✅ Modo oscuro/claro
- ✅ Generación de contratos PDF
- ✅ Verificación de estudiantes

## 👥 Equipo

- **Victor Cuaresma** - Administrador
- **Ronaldinho Ccencho Ramos** - Administrador

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Angular Team
- Ethers.js
- MetaMask
- SweetAlert2
- Comunidad Ethereum

---

## 📞 Soporte

¿Necesitas ayuda? 

- 📧 Email: support@microtrust.com
- 💬 Discord: [MicroTrust Community]
- 🐦 Twitter: [@MicroTrust]
- 📚 Docs: [docs.microtrust.com]

---

**Hecho con ❤️ por el equipo de MicroTrust**

