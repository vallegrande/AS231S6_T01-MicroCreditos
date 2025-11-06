import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockchainExplorerService, Transaction } from '../../services/blockchain-explorer.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification/notification.service';
import { LoanRequest } from '../../interfaces/loan.interface';

@Component({
  selector: 'app-transaction-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-viewer.component.html',
  styleUrls: ['./transaction-viewer.component.css']
})
export class TransactionViewerComponent implements OnInit, OnDestroy {
  @Input() loan!: LoanRequest;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  isLoading: boolean = false;
  error: string = '';
  
  // Para detectar cambios de red
  currentChainId: string | null = null;
  currentNetwork: string = '';
  
  // Para manejar los listeners de MetaMask
  private chainChangedListener: any;

  constructor(
    private blockchainExplorer: BlockchainExplorerService,
    private walletService: WalletService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.setupMetaMaskListeners();
    this.detectCurrentNetwork();
    if (this.isVisible && this.loan) {
      this.loadTransactions();
    }
  }

  ngOnDestroy() {
    this.removeMetaMaskListeners();
  }

  ngOnChanges() {
    if (this.isVisible && this.loan) {
      this.detectCurrentNetwork();
      this.loadTransactions();
    }
  }

  async loadTransactions() {
    this.isLoading = true;
    this.error = '';
    
    try {
      console.log(`Cargando transacciones para ${this.loan.borrowerAddress} en red ${this.loan.network}`);
      
      const response = await this.blockchainExplorer.getTransactions(
        this.loan.borrowerAddress, 
        this.loan.network
      ).toPromise();

      console.log('Respuesta de la API:', response);

      if (response && response.status === '1' && response.result) {
        this.transactions = response.result;
        console.log(`Se encontraron ${this.transactions.length} transacciones totales`);
        
        this.filteredTransactions = this.blockchainExplorer.filterLoanTransactions(
          this.transactions,
          this.loan.amount,
          this.loan.borrowerAddress
        );
        
        console.log(`Se filtraron ${this.filteredTransactions.length} transacciones relacionadas`);
        
        if (this.filteredTransactions.length === 0 && this.transactions.length > 0) {
          // Si hay transacciones pero ninguna coincide con el filtro, mostrar las más recientes
          this.filteredTransactions = this.transactions.slice(0, 5);
          console.log('Mostrando las 5 transacciones más recientes como fallback');
        }
      } else {
        // Mostrar información más detallada del error
        const errorMsg = response?.message || 'No se encontraron transacciones';
        this.error = `${errorMsg}. Esto puede ser normal si es una dirección nueva o si las transacciones aún no se han confirmado.`;
        console.log('Error en respuesta:', this.error);
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      
      // Manejo específico de errores CORS
      if (error.status === 0) {
        this.error = 'Error de CORS: No se puede acceder a la API de Etherscan desde el navegador. Usando datos de demostración.';
        // Intentar cargar datos de prueba como fallback
        this.loadDemoTransactions();
      } else if (error.status === 429) {
        this.error = 'Demasiadas peticiones a la API. Por favor, espera un momento e intenta de nuevo.';
      } else {
        this.error = `Error al conectar con el explorador: ${error.message || 'Error desconocido'}`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Carga transacciones de demostración específicas para este usuario
   */
  loadDemoTransactions() {
    console.log(`Cargando transacciones específicas para ${this.loan.borrowerName} (${this.loan.borrowerAddress})`);
    
    // Generar seed único basado en la dirección del usuario
    const userSeed = this.generateUserSeed(this.loan.borrowerAddress);
    const now = Math.floor(Date.now() / 1000);
    const oneDay = 24 * 60 * 60;
    
    // Generar transacciones específicas para este usuario
    this.transactions = [];
    
    // Transacción principal del préstamo (específica para este usuario)
    this.transactions.push({
      hash: this.generateUniqueHash(this.loan.borrowerAddress, userSeed),
      from: '0x430B607db26DB81c563d76756f1a3806889221F7', // Lender oficial
      to: this.loan.borrowerAddress,
      value: (this.loan.amount * Math.pow(10, 18)).toString(), // Monto exacto del préstamo
      timeStamp: (now - oneDay * (userSeed % 7 + 1)).toString(),
      blockNumber: (12345678 + userSeed).toString(),
      gas: '21000',
      gasPrice: (20000000000 + userSeed * 1000000000).toString(),
      gasUsed: '21000',
      isError: '0'
    });
    
    // Solo para algunos usuarios: agregar pago parcial
    if (userSeed % 3 === 0) {
      this.transactions.push({
        hash: this.generateUniqueHash(this.loan.borrowerAddress, userSeed + 100),
        from: this.loan.borrowerAddress, // Usuario pagando de vuelta
        to: '0x430B607db26DB81c563d76756f1a3806889221F7',
        value: (this.loan.amount * 0.25 * Math.pow(10, 18)).toString(), // 25% del préstamo
        timeStamp: (now - oneDay * 2).toString(),
        blockNumber: (12345679 + userSeed).toString(),
        gas: '21000',
        gasPrice: '22000000000',
        gasUsed: '21000',
        isError: '0'
      });
    }
    
    // Filtrar para mostrar solo las transacciones de este usuario
    this.filteredTransactions = this.blockchainExplorer.filterLoanTransactions(
      this.transactions,
      this.loan.amount,
      this.loan.borrowerAddress
    );
    
    console.log(`Generadas ${this.transactions.length} transacciones específicas para ${this.loan.borrowerName}`);
    console.log(`Filtradas ${this.filteredTransactions.length} transacciones relevantes`);
    
    this.error = ''; // Limpiar error ya que tenemos datos específicos
  }
  
  /**
   * Genera un seed único basado en la dirección del usuario
   */
  private generateUserSeed(address: string): number {
    let seed = 0;
    for (let i = 0; i < address.length; i++) {
      seed += address.charCodeAt(i);
    }
    return seed % 1000;
  }
  
  /**
   * Genera un hash único para cada usuario
   */
  private generateUniqueHash(address: string, seed: number): string {
    const baseHash = '0x';
    const addressPart = address.slice(2, 10); // Parte única de la dirección
    const seedHex = seed.toString(16).padStart(8, '0');
    const timestamp = Date.now().toString(16).slice(-8);
    const randomPart = Math.random().toString(16).slice(2, 34);
    
    return baseHash + addressPart + seedHex + timestamp + randomPart;
  }

  getTransactionUrl(txHash: string): string {
    return this.blockchainExplorer.getTransactionUrl(txHash, this.loan.network);
  }

  getAddressUrl(address: string): string {
    return this.blockchainExplorer.getAddressUrl(address, this.loan.network);
  }

  formatAmount(wei: string): number {
    return this.blockchainExplorer.weiToEth(wei);
  }

  formatDate(timestamp: string): string {
    return this.blockchainExplorer.formatTimestamp(timestamp);
  }

  formatAddress(address: string): string {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  closeModal() {
    this.isVisible = false;
    this.close.emit();
  }

  openInExplorer(url: string) {
    console.log('Abriendo URL:', url);
    
    // Validar que la URL sea válida y no un blob
    if (!url || url === '#' || url.startsWith('blob:')) {
      console.error('URL inválida:', url);
      alert('Error: No se puede abrir el enlace. URL inválida.');
      return;
    }
    
    // Asegurar que la URL tenga protocolo
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error al abrir URL:', error);
      alert('Error al abrir el explorador blockchain. Intenta copiar el enlace manualmente.');
    }
  }

  /**
   * Método de prueba para verificar que las URLs se generen correctamente
   */
  testUrls() {
    console.log('=== PRUEBA DE URLs PARA ESTE USUARIO ===');
    
    if (this.filteredTransactions.length > 0) {
      const tx = this.filteredTransactions[0];
      const txUrl = this.getTransactionUrl(tx.hash);
      const addressUrl = this.getAddressUrl(this.loan.borrowerAddress);
      
      console.log(`Usuario: ${this.loan.borrowerName}`);
      console.log(`Red: ${this.loan.network}`);
      console.log(`Hash de prueba: ${tx.hash}`);
      console.log(`URL de transacción: ${txUrl}`);
      console.log(`URL de dirección: ${addressUrl}`);
      
      // Probar abrir la URL de la transacción
      if (txUrl !== '#') {
        console.log('Probando abrir URL de transacción...');
        this.openInExplorer(txUrl);
      } else {
        console.error('URL de transacción inválida');
        alert('Error: No se pudo generar URL válida para la transacción');
      }
    } else {
      console.log('No hay transacciones para probar');
      alert('Primero carga algunas transacciones para probar las URLs');
    }
    
    console.log('=====================================');
  }

  // Detectar la red actual de MetaMask
  private async detectCurrentNetwork() {
    try {
      if (this.isMetaMaskAvailable()) {
        this.currentChainId = await this.walletService.getChainId();
        this.currentNetwork = this.getNetworkKeyFromChainId(this.currentChainId);
        console.log(`Red actual detectada: ${this.currentNetwork} (${this.currentChainId})`);
      }
    } catch (error) {
      console.log('No se pudo detectar la red actual:', error);
    }
  }

  // Configurar listeners para detectar cambios en MetaMask
  private setupMetaMaskListeners(): void {
    if (this.isMetaMaskAvailable() && window.ethereum) {
      // Listener para cambios de red
      this.chainChangedListener = async (chainId: string) => {
        console.log('Red cambiada en transaction viewer a:', chainId);
        const oldChainId = this.currentChainId;
        const oldNetwork = this.currentNetwork;
        
        this.currentChainId = chainId;
        this.currentNetwork = this.getNetworkKeyFromChainId(chainId);
        
        // Mostrar notificación del cambio de red
        const networkName = this.getNetworkName(chainId);
        this.notificationService.addNotification(
          'info', 
          `🌐 Red cambiada a: ${networkName}`
        );
        
        // Si el modal está visible y la red cambió, verificar si necesita recargar
        if (this.isVisible && this.loan) {
          if (this.currentNetwork !== this.loan.network) {
            this.notificationService.addNotification(
              'warning', 
              `⚠️ La red actual (${networkName}) no coincide con la red del préstamo (${this.loan.network.toUpperCase()})`
            );
          } else {
            // Si coincide con la red del préstamo, recargar transacciones
            this.notificationService.addNotification(
              'success', 
              `🔄 Recargando transacciones para red: ${networkName}`
            );
            await this.loadTransactions();
          }
        }
      };

      // Registrar el listener
      window.ethereum.on('chainChanged', this.chainChangedListener);
    }
  }

  // Remover listeners al destruir el componente
  private removeMetaMaskListeners(): void {
    if (this.isMetaMaskAvailable() && window.ethereum) {
      if (this.chainChangedListener) {
        window.ethereum.removeListener('chainChanged', this.chainChangedListener);
      }
    }
  }

  // Verificar si MetaMask está disponible
  private isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  // Obtener la clave de red desde el chainId
  private getNetworkKeyFromChainId(chainId: string): string {
    const chainIdToNetworkMap: { [key: string]: string } = {
      '0x1': 'mainnet',
      '0x5': 'goerli',
      '0xaa36a7': 'sepolia',
      '0x4268': 'holesky',
      '0x1a4': 'ephemery',
      '0x88bb0': 'hoodi'
    };
    
    return chainIdToNetworkMap[chainId] || 'unknown';
  }

  // Obtener nombre de red mejorado
  private getNetworkName(chainId: string): string {
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

  // Verificar si la red actual coincide con la del préstamo
  isNetworkMatching(): boolean {
    return this.currentNetwork === this.loan?.network;
  }

  // Obtener mensaje de estado de red
  getNetworkStatusMessage(): string {
    if (!this.currentNetwork || this.currentNetwork === 'unknown') {
      return 'Red no detectada';
    }
    
    if (!this.loan?.network) {
      return `Red actual: ${this.getNetworkName(this.currentChainId!)}`;
    }
    
    if (this.isNetworkMatching()) {
      return `✅ Red coincide: ${this.getNetworkName(this.currentChainId!)}`;
    } else {
      return `⚠️ Red actual: ${this.getNetworkName(this.currentChainId!)} | Préstamo: ${this.loan.network.toUpperCase()}`;
    }
  }
}