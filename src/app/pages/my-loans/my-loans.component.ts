import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../services/wallet.service';
import { LoanService } from '../../services/loan/loan.service';
import { SmartContractService } from '../../services/smart-contract.service';
import { ContractService } from '../../services/contract/contract.service';
import { NotificationService } from '../../services/notification/notification.service';
import { LoanRequest } from '../../interfaces/loan.interface';
import { APP_CONSTANTS } from '../../constants/app.constants';
import { TransactionViewerComponent } from '../../shared/transaction-viewer/transaction-viewer.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, TransactionViewerComponent],
  templateUrl: './my-loans.component.html',
  styleUrls: ['./my-loans.component.css']
})
export class MyLoansComponent implements OnInit, OnDestroy {
  account: string | null = null;
  chainId: string | null = null;
  currentNetwork: string = '';
  allLoans: LoanRequest[] = [];
  filteredLoans: LoanRequest[] = [];
  loans: LoanRequest[] = []; // Para mantener compatibilidad
  error: string | null = null;
  
  // Filtros
  filterStatus: string = 'all';
  filterNetwork: string = 'all';
  searchTerm: string = '';
  selectedLoan: LoanRequest | null = null;
  contractPreview: string = '';
  showContractPreview: boolean = false;
  isPaying: boolean = false;
  showTransactionViewer: boolean = false;
  transactionViewerLoan: LoanRequest | null = null;
  
  // Para manejar los listeners de MetaMask
  private accountsChangedListener: any;
  private chainChangedListener: any;

  constructor(
    private wallet: WalletService,
    private loanService: LoanService,
    private smartContract: SmartContractService,
    private contractService: ContractService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit() {
    this.loadAccountAndLoans();
    this.setupMetaMaskListeners();
  }

  ngOnDestroy() {
    this.removeMetaMaskListeners();
  }
  
  async loadAccountAndLoans() {
    try {
      const accounts = await this.wallet.getAccounts();
      if (accounts && accounts.length > 0) {
        this.account = accounts[0];
        this.chainId = await this.wallet.getChainId();
        this.currentNetwork = this.getNetworkKeyFromChainId(this.chainId);
        
        // Cargar todos los préstamos
        this.allLoans = this.loanService.getLoansByBorrower(this.account);
        
        // Aplicar filtros
        this.applyFilters();
      } else {
        this.error = 'No se ha detectado una wallet conectada. Por favor, conecta tu wallet para ver tus préstamos.';
      }
    } catch (e: any) {
      this.error = e?.message || 'Error al cargar la información';
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'disbursed': return 'status-disbursed';
      case 'paid': return 'status-paid';
      default: return 'status-pending';
    }
  }
  
  getPurposeTypeLabel(type: string): string {
    return (APP_CONSTANTS.PURPOSE_TYPE_LABELS as any)[type] || type;
  }
  
  getNetworkLabel(network: string): string {
    return (APP_CONSTANTS.NETWORK_LABELS as any)[network] || network;
  }
  
  getStatusLabel(status: string): string {
    return (APP_CONSTANTS.LOAN_STATUS_LABELS as any)[status] || status;
  }

  getExplorerUrl(network: string, txHash: string): string {
    const explorers: { [key: string]: string } = {
      'holesky': 'https://holesky.etherscan.io/tx/',
      'sepolia': 'https://sepolia.etherscan.io/tx/',
      'goerli': 'https://goerli.etherscan.io/tx/',
      'ephemery': 'https://explorer.ephemery.dev/tx/'
    };
    return (explorers[network] || explorers['holesky']) + txHash;
  }
  
  selectLoan(loan: LoanRequest) {
    this.selectedLoan = loan;
  }
  
  deselectLoan() {
    this.selectedLoan = null;
  }

  // Método para abrir el visor de transacciones
  openTransactionViewer(loan: LoanRequest) {
    this.transactionViewerLoan = loan;
    this.showTransactionViewer = true;
  }

  // Método para cerrar el visor de transacciones
  closeTransactionViewer() {
    this.showTransactionViewer = false;
    this.transactionViewerLoan = null;
  }

  // Generar e imprimir contrato
  generateAndPrintContract(loan: LoanRequest): void {
    this.contractService.generateContract(loan);
  }

  // Descargar contrato
  downloadContract(loan: LoanRequest): void {
    this.contractService.downloadContract(loan);
  }

  // Ver contrato en nueva pestaña
  viewContract(loan: LoanRequest): void {
    this.contractService.viewContract(loan);
  }

  // Imprimir contrato directamente
  printContract(loan: LoanRequest): void {
    this.contractService.printContract(loan);
  }
  
  // Método para ver el motivo del rechazo
  async viewRejectionReason(loan: LoanRequest) {
    if (!loan.rejectionReason) {
      await Swal.fire({
        icon: 'info',
        title: 'Préstamo Rechazado',
        text: 'No se proporcionó información adicional sobre el rechazo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional',
          confirmButton: 'swal-btn swal2-cancel-custom'
        }
      });
      return;
    }

    await Swal.fire({
      icon: 'error',
      title: 'Préstamo Rechazado',
      html: `
        <div class="rejection-details">
          <div class="rejection-icon-container">
            <i class="fas fa-times-circle" style="font-size: 3.5rem; color: #ef4444; margin-bottom: 1rem;"></i>
          </div>
          <p style="font-size: 1.05rem; margin: 1.5rem 0; color: var(--text-secondary);">Tu solicitud de préstamo ha sido rechazada por el siguiente motivo:</p>
          <div style="padding: 1.25rem; background: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); margin: 1.5rem 0; text-align: left;">
            <p style="font-size: 0.85rem; color: #ef4444; margin-bottom: 0.5rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fas fa-info-circle"></i> Motivo del Rechazo
            </p>
            <p style="font-size: 1rem; color: var(--text-primary); line-height: 1.6; margin: 0;">${loan.rejectionReason}</p>
          </div>
          ${loan.rejectedAt ? `
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 1rem;">
              <i class="fas fa-clock"></i> Fecha de rechazo: ${new Date(loan.rejectedAt).toLocaleString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          ` : ''}
          <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
            <p style="font-size: 0.9rem; color: var(--text-primary); margin: 0;">
              <i class="fas fa-lightbulb" style="color: #00d4ff;"></i> Puedes realizar una nueva solicitud corrigiendo los aspectos mencionados.
            </p>
          </div>
        </div>
      `,
      confirmButtonText: '<i class="fas fa-check"></i> Entendido',
      confirmButtonColor: '#6b7280',
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      customClass: {
        popup: 'swal-professional swal-wide',
        confirmButton: 'swal-btn swal2-confirm-success'
      },
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });
  }

  // Método para pagar un préstamo
  async payLoan(loan: LoanRequest) {
    if (!this.account) {
      await Swal.fire({
        title: 'Wallet no conectada',
        text: 'Debes conectar tu wallet primero',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    // Confirmar con el usuario antes de proceder
    const totalAmount = loan.amount + (loan.amount * loan.interestRate);
    const result = await Swal.fire({
      title: '¿Pagar préstamo?',
      html: `
        <p>¿Estás seguro de que quieres pagar este préstamo?</p>
        <br>
        <p><strong>Monto principal:</strong> ${loan.amount} ETH</p>
        <p><strong>Interés:</strong> ${(loan.amount * loan.interestRate).toFixed(4)} ETH</p>
        <p><strong>Total a pagar:</strong> ${totalAmount.toFixed(4)} ETH</p>
        <br>
        <p>Esta acción no se puede deshacer.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, pagar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
    
    if (!result.isConfirmed) {
      return;
    }
    
    this.isPaying = true;
    
    try {
      // Verificar si el préstamo tiene ID de blockchain
      const blockchainLoanId = loan.blockchainLoanId;
      if (!blockchainLoanId) {
        // Si no tiene ID de blockchain, intentar pagar solo localmente
        console.warn('⚠️ Préstamo no tiene ID de blockchain, pagando solo localmente');
        const result = await this.loanService.payLoan(loan.id, this.account);
        if (result.success) {
          await Swal.fire({
            title: '¡Pago realizado!',
            html: `
              <div style="text-align: left; padding: 1rem;">
                <p>El pago ha sido registrado localmente (este préstamo no estaba en blockchain).</p>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 1rem;">
                  ${result.message}
                </p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });
          this.loans = this.loanService.getLoansByBorrower(this.account);
        } else {
          throw new Error(result.message);
        }
        return;
      }

      // Mostrar loading
      Swal.fire({
        title: '⏳ Pagando en Blockchain',
        html: `
          <div style="text-align: center; padding: 1rem;">
            <p>Estamos procesando tu pago en la blockchain...</p>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 1rem;">
              MetaMask abrirá una ventana para confirmar la transacción.
            </p>
          </div>
        `,
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // 1. Pagar en el Smart Contract (BLOCKCHAIN)
      const blockchainResult = await this.smartContract.payLoan(
        blockchainLoanId,
        totalAmount.toFixed(6) // Monto total con interés
      );

      if (!blockchainResult.success) {
        throw new Error(blockchainResult.message || 'Error al pagar en blockchain');
      }

      // 2. Actualizar también localmente
      const localResult = await this.loanService.payLoan(loan.id, this.account);
      
      // 3. Agregar información de blockchain al préstamo local
      const updatedLoan = this.loanService.getLoansByBorrower(this.account).find(l => l.id === loan.id);
      if (updatedLoan) {
        updatedLoan.transactionHash = blockchainResult.txHash;
      }

      Swal.close();

      // Mostrar éxito con información de blockchain
      const explorerUrl = this.getExplorerUrl(loan.network, blockchainResult.txHash!);
      await Swal.fire({
        title: '✅ ¡Pago Realizado en Blockchain!',
        html: `
          <div style="text-align: left; padding: 1rem;">
            <p style="margin-bottom: 1rem;">Tu pago ha sido procesado exitosamente en la blockchain.</p>
            <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p style="margin: 0.5rem 0;"><strong>💰 Total pagado:</strong> ${totalAmount.toFixed(6)} ETH</p>
              <p style="margin: 0.5rem 0;"><strong>🔗 Hash de Transacción:</strong></p>
              <p style="margin: 0.5rem 0; word-break: break-all; font-family: monospace; font-size: 0.85rem;">
                ${blockchainResult.txHash}
              </p>
            </div>
            <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.9rem;">
              Puedes verificar la transacción en el explorador de bloques.
            </p>
          </div>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Ver en Explorador',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional',
          confirmButton: 'swal-btn swal2-confirm-success',
          cancelButton: 'swal-btn swal2-cancel-custom'
        },
        didOpen: () => {
          const confirmBtn = Swal.getConfirmButton();
          if (confirmBtn) {
            confirmBtn.onclick = () => window.open(explorerUrl, '_blank');
          }
        }
      });

      // Actualizar la lista de préstamos
      this.loans = this.loanService.getLoansByBorrower(this.account);
      this.allLoans = this.loanService.getAllLoans();
      this.applyFilters();

    } catch (error: any) {
      Swal.close();
      console.error('Error al pagar el préstamo:', error);
      await Swal.fire({
        title: '❌ Error al Pagar Préstamo',
        html: `
          <div style="text-align: left; padding: 1rem;">
            <p style="margin-bottom: 1rem;">${error.message || 'Error desconocido'}</p>
            <p style="color: var(--text-muted); font-size: 0.9rem;">
              Por favor, verifica que MetaMask esté conectado y que tengas suficiente balance para pagar la tarifa de gas y el monto total del préstamo.
            </p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional',
          confirmButton: 'swal-btn swal2-confirm-danger'
        }
      });
    } finally {
      this.isPaying = false;
    }
  }

  // Aplicar todos los filtros
  applyFilters(): void {
    let filtered = this.allLoans;
    
    // Filtrar por estado
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(loan => loan.status === this.filterStatus);
    }
    
    // Filtrar por red
    if (this.filterNetwork !== 'all') {
      filtered = filtered.filter(loan => loan.network === this.filterNetwork);
    }
    
    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(loan => 
        loan.id.toLowerCase().includes(term) ||
        loan.purpose.toLowerCase().includes(term) ||
        loan.borrowerName?.toLowerCase().includes(term) ||
        this.getPurposeTypeLabel(loan.purposeType).toLowerCase().includes(term)
      );
    }
    
    this.filteredLoans = filtered;
    this.loans = this.filteredLoans; // Para mantener compatibilidad
    
    console.log(`Filtros aplicados - Total: ${this.allLoans.length}, Filtrados: ${this.filteredLoans.length}`);
  }

  // Configurar listeners para detectar cambios en MetaMask
  private setupMetaMaskListeners(): void {
    if (this.isMetaMaskAvailable() && window.ethereum) {
      // Listener para cambios de cuenta
      this.accountsChangedListener = async (accounts: string[]) => {
        console.log('Cuentas cambiadas en mis préstamos:', accounts);
        if (accounts.length === 0) {
          // Usuario desconectó MetaMask
          this.account = null;
          this.chainId = null;
          this.currentNetwork = '';
          this.allLoans = [];
          this.filteredLoans = [];
          this.loans = [];
          this.error = 'Wallet desconectada. Por favor, conecta tu wallet para ver tus préstamos.';
          this.notificationService.addNotification(
            'warning', 
            '⚠️ Wallet desconectada'
          );
        } else if (accounts[0] !== this.account) {
          // Usuario cambió de cuenta
          this.account = accounts[0];
          this.notificationService.addNotification(
            'info', 
            `🔄 Cuenta cambiada: ...${accounts[0].slice(-4)}`
          );
          
          // Recargar préstamos para la nueva cuenta
          await this.loadAccountAndLoans();
        }
      };

      // Listener para cambios de red
      this.chainChangedListener = async (chainId: string) => {
        console.log('Red cambiada en mis préstamos a:', chainId);
        const oldChainId = this.chainId;
        const oldNetwork = this.currentNetwork;
        
        this.chainId = chainId;
        this.currentNetwork = this.getNetworkKeyFromChainId(chainId);
        
        // Mostrar notificación del cambio de red
        const networkName = this.getNetworkName(chainId);
        this.notificationService.addNotification(
          'info', 
          `🌐 Red cambiada a: ${networkName}`
        );
        
        // Actualizar filtro de red automáticamente si está en "all"
        if (this.filterNetwork === 'all' && this.currentNetwork && this.currentNetwork !== 'unknown') {
          this.filterNetwork = this.currentNetwork;
          this.notificationService.addNotification(
            'info', 
            `🔍 Filtro actualizado a red: ${networkName}`
          );
        }
        
        // Aplicar filtros
        this.applyFilters();
        
        // Mostrar información sobre el filtrado
        const filteredCount = this.filteredLoans.length;
        const totalCount = this.allLoans.length;
        
        if (filteredCount === 0 && totalCount > 0) {
          this.notificationService.addNotification(
            'warning', 
            `⚠️ No hay préstamos que coincidan con los filtros en ${networkName}`
          );
        } else if (filteredCount > 0) {
          this.notificationService.addNotification(
            'success', 
            `🔍 Mostrando ${filteredCount} préstamo${filteredCount > 1 ? 's' : ''} con filtros aplicados`
          );
        }
      };

      // Registrar los listeners
      window.ethereum.on('accountsChanged', this.accountsChangedListener);
      window.ethereum.on('chainChanged', this.chainChangedListener);
    }
  }

  // Remover listeners al destruir el componente
  private removeMetaMaskListeners(): void {
    if (this.isMetaMaskAvailable() && window.ethereum) {
      if (this.accountsChangedListener) {
        window.ethereum.removeListener('accountsChanged', this.accountsChangedListener);
      }
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

  // Obtener información de filtrado para mostrar al usuario
  getFilterInfo(): string {
    if (!this.currentNetwork || this.currentNetwork === 'unknown') {
      return 'Mostrando todos los préstamos';
    }
    
    const networkName = this.getNetworkName(this.chainId!);
    const filteredCount = this.filteredLoans.length;
    const totalCount = this.allLoans.length;
    
    if (filteredCount === totalCount) {
      return `Todos tus préstamos están en ${networkName}`;
    } else if (filteredCount === 0) {
      return `No tienes préstamos en ${networkName}`;
    } else {
      return `Mostrando ${filteredCount} de ${totalCount} préstamos en ${networkName}`;
    }
  }

  // Verificar si hay préstamos en otras redes
  hasLoansInOtherNetworks(): boolean {
    return this.allLoans.length > this.filteredLoans.length;
  }

  // Obtener redes con préstamos
  getNetworksWithLoans(): string[] {
    const networks = new Set<string>();
    this.allLoans.forEach(loan => {
      if (loan.network) {
        networks.add(loan.network);
      }
    });
    return Array.from(networks);
  }

  // Obtener redes con préstamos
  getAvailableNetworks(): string[] {
    const networks = new Set<string>();
    this.allLoans.forEach(loan => {
      if (loan.network) {
        networks.add(loan.network);
      }
    });
    return Array.from(networks).sort();
  }

  // Función para cambiar el filtro de red automáticamente
  setNetworkFilter(network: string): void {
    this.filterNetwork = network;
    this.applyFilters();
    
    if (network === 'all') {
      this.notificationService.addNotification(
        'info', 
        '🔍 Mostrando préstamos de todas las redes'
      );
    } else {
      this.notificationService.addNotification(
        'info', 
        `🔍 Filtrando préstamos de red: ${this.getNetworkLabel(network)}`
      );
    }
  }

  // Obtener información del filtro actual
  getFilterSummary(): string {
    const total = this.allLoans.length;
    const filtered = this.filteredLoans.length;
    
    if (total === 0) {
      return 'No tienes préstamos';
    }
    
    if (filtered === total) {
      return `Mostrando todos tus ${total} préstamos`;
    }
    
    return `Mostrando ${filtered} de ${total} préstamos`;
  }
}