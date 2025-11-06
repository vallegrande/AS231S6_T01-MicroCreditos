import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../services/wallet.service';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification/notification.service';
import { APP_CONSTANTS } from '../../constants/app.constants';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.css']
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  account: string | null = null;
  chainId: string | null = null;
  balance: string = '0.0';
  isAdmin: boolean = false;
  currentUser: User | null = null;
  selectedNetwork: string = 'holesky'; // Red por defecto para usuarios no-Web3
  availableNetworks = APP_CONSTANTS.NETWORKS;
  isLoadingBalance: boolean = false;
  
  // Para manejar los listeners de MetaMask
  private accountsChangedListener: any;
  private chainChangedListener: any;

  constructor(
    private wallet: WalletService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.checkConnection();
    this.setupMetaMaskListeners();
  }

  ngOnDestroy() {
    this.removeMetaMaskListeners();
  }

  async checkConnection() {
    if (this.currentUser?.loginMethod === 'web3') {
      // Usuario con MetaMask
      try {
        const accounts = await this.wallet.getAccounts();
        if (accounts && accounts.length > 0) {
          this.account = accounts[0];
          this.chainId = await this.wallet.getChainId();
          await this.loadBalance();
        }
      } catch (err: any) {
        console.log('No hay conexión previa con MetaMask');
      }
    } else {
      // Usuario con Google/GitHub - usar red seleccionada
      this.account = null;
      this.chainId = null;
      this.balance = '0.0';
    }
  }

  // Cargar saldo de la wallet
  async loadBalance() {
    if (!this.account) return;
    
    this.isLoadingBalance = true;
    try {
      const balanceWei = await this.wallet.getBalance(this.account);
      // Usar la función de conversión del servicio
      this.balance = this.wallet.weiToEth(balanceWei);
      console.log(`Saldo actualizado: ${this.balance} ETH en red ${this.getNetworkName(this.chainId!)}`);
    } catch (error) {
      console.error('Error cargando saldo:', error);
      this.balance = '0.0000';
    } finally {
      this.isLoadingBalance = false;
    }
  }

  // Refrescar saldo
  async refreshBalance() {
    await this.loadBalance();
  }

  // Cambiar red para usuarios no-Web3
  changeNetwork(networkKey: string) {
    this.selectedNetwork = networkKey;
    console.log('Red seleccionada:', networkKey, 'Límite:', this.getNetworkLimit(networkKey), 'ETH');
  }

  // Obtener límite de la red seleccionada
  getNetworkLimit(networkKey: string): number {
    const network = this.availableNetworks[networkKey.toUpperCase() as keyof typeof this.availableNetworks];
    return network ? network.limit : 0;
  }

  // Conectar MetaMask para usuarios que se loguearon con Google/GitHub
  async connectMetaMask() {
    if (!this.isMetaMaskAvailable()) {
      this.notificationService.addNotification(
        'error', 
        '❌ MetaMask no está instalado. Por favor, instálalo desde metamask.io'
      );
      return;
    }

    try {
      // Solicitar conexión a MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        this.account = accounts[0];
        this.chainId = await this.wallet.getChainId();
        await this.loadBalance();
        
        this.notificationService.addNotification(
          'success', 
          `🦊 MetaMask conectado: ...${this.account?.slice(-4) || 'desconocida'}`
        );
        
        console.log('MetaMask conectado:', this.account);
      }
    } catch (error: any) {
      console.error('Error conectando MetaMask:', error);
      
      if (error.code === 4001) {
        this.notificationService.addNotification(
          'warning', 
          '⚠️ Conexión cancelada por el usuario'
        );
      } else {
        this.notificationService.addNotification(
          'error', 
          '❌ Error al conectar MetaMask'
        );
      }
    }
  }

  getNetworkName(chainId: string): string {
    const chainIdMap: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli',
      '0xaa36a7': 'Sepolia',
      '0x4268': 'Holešky',
      '0x1a4': 'Ephemery',
      '0x88bb0': 'Ethereum Hoodi',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
      '0xa86a': 'Avalanche Mainnet',
      '0xa869': 'Avalanche Fuji'
    };
    
    return chainIdMap[chainId] || `Red Desconocida (${chainId})`;
  }

  // Obtener inicial del usuario para el avatar
  getUserInitial(): string {
    if (this.currentUser?.name) {
      return this.currentUser.name.charAt(0).toUpperCase();
    }
    if (this.currentUser?.email) {
      return this.currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  // Verificar si MetaMask está disponible
  private isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  // Configurar listeners para detectar cambios en MetaMask
  private setupMetaMaskListeners() {
    if (this.isMetaMaskAvailable() && window.ethereum) {
      // Listener para cambios de cuenta
      this.accountsChangedListener = async (accounts: string[]) => {
        console.log('Cuentas cambiadas:', accounts);
        if (accounts.length === 0) {
          // Usuario desconectó MetaMask
          this.account = null;
          this.chainId = null;
          this.balance = '0.0000';
          this.notificationService.addNotification(
            'warning', 
            '⚠️ MetaMask desconectado'
          );
        } else if (accounts[0] !== this.account) {
          // Usuario cambió de cuenta
          const oldAccount = this.account;
          this.account = accounts[0];
          this.notificationService.addNotification(
            'info', 
            `🔄 Cuenta cambiada: ...${accounts[0].slice(-4)}`
          );
          await this.loadBalance();
          this.notificationService.addNotification(
            'success', 
            `💰 Saldo actualizado: ${this.balance} ETH`
          );
        }
      };

      // Listener para cambios de red
      this.chainChangedListener = async (chainId: string) => {
        console.log('Red cambiada a:', chainId);
        const oldChainId = this.chainId;
        this.chainId = chainId;
        
        // Mostrar notificación del cambio de red
        const networkName = this.getNetworkName(chainId);
        this.notificationService.addNotification(
          'info', 
          `🌐 Red cambiada a: ${networkName}`
        );
        
        // Actualizar saldo cuando cambie la red
        if (this.account) {
          await this.loadBalance();
          this.notificationService.addNotification(
            'success', 
            `💰 Saldo actualizado: ${this.balance} ETH`
          );
        }
      };

      // Registrar los listeners
      window.ethereum.on('accountsChanged', this.accountsChangedListener);
      window.ethereum.on('chainChanged', this.chainChangedListener);
    }
  }

  // Remover listeners al destruir el componente
  private removeMetaMaskListeners() {
    if (this.isMetaMaskAvailable() && window.ethereum) {
      if (this.accountsChangedListener) {
        window.ethereum.removeListener('accountsChanged', this.accountsChangedListener);
      }
      if (this.chainChangedListener) {
        window.ethereum.removeListener('chainChanged', this.chainChangedListener);
      }
    }
  }
}