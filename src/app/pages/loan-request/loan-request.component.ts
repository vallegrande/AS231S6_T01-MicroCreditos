import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../../services/wallet.service';
import { LoanService } from '../../services/loan/loan.service';
import { SmartContractService } from '../../services/smart-contract.service';
import { APP_CONSTANTS } from '../../constants/app.constants';
import { PurposeTypeConfig, NetworkConfig } from '../../interfaces/loan.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-loan-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loan-request.component.html',
  styleUrls: ['./loan-request.component.css']
})
export class LoanRequestComponent implements OnInit {
  account: string | null = null;
  chainId: string | null = null;
  error: string | null = null;
  isLoading: boolean = false;
  isStudentVerified: boolean = false;
  studentVerificationData: any = null;
  
  // Formulario de solicitud
  loanForm = {
    borrowerName: '',
    amount: null as number | null,
    purpose: '',
    purposeType: 'other' as 'student' | 'business' | 'health' | 'events' | 'other',
    network: 'hoodi' as 'goerli' | 'holesky' | 'sepolia' | 'ephemery' | 'hoodi',
    loanDuration: 7 as number // Duración del préstamo en días (por defecto 7 días)
  };
  
  // Información calculada
  interestRate: number = APP_CONSTANTS.PURPOSE_TYPES.OTHER.interestRate;
  finalInterestRate: number = APP_CONSTANTS.PURPOSE_TYPES.OTHER.interestRate; // Tasa final con descuento
  totalAmount: number = 0;
  loanLimit: number = 0; // Se actualizará en ngOnInit según la red por defecto
  hasDiscount: boolean = false; // Indica si tiene descuento por pago rápido
  discountPercentage: number = 0; // Porcentaje de descuento aplicado
  
  // Redes disponibles
  networks = [
    APP_CONSTANTS.NETWORKS.GOERLI,
    APP_CONSTANTS.NETWORKS.HOODI,
    APP_CONSTANTS.NETWORKS.HOLESKY,
    APP_CONSTANTS.NETWORKS.SEPOLIA,
    APP_CONSTANTS.NETWORKS.EPHEMERY
  ];
  
  // Tipos de propósito
  purposeTypes = [
    APP_CONSTANTS.PURPOSE_TYPES.STUDENT,
    APP_CONSTANTS.PURPOSE_TYPES.BUSINESS,
    APP_CONSTANTS.PURPOSE_TYPES.HEALTH,
    APP_CONSTANTS.PURPOSE_TYPES.EVENTS,
    APP_CONSTANTS.PURPOSE_TYPES.OTHER
  ];
  
  // Opciones de duración del préstamo
  loanDurations = [
    { value: 7, label: '7 días' },
    { value: 15, label: '15 días' },
    { value: 30, label: '1 mes' },
    { value: 60, label: '2 meses' },
    { value: 90, label: '3 meses' }
  ];

  constructor(
    private wallet: WalletService,
    private loanService: LoanService,
    private smartContract: SmartContractService
  ) {}
  
  ngOnInit() {
    this.updateInterestRate();
    this.updateLoanLimit(); // Establecer límite inicial según la red por defecto
    this.calculateFinalInterestRate(); // Calcular tasa final con descuentos
    this.checkStudentVerification();
    
    // Escuchar cambios en la verificación de estudiante (cuando se cierra la ventana)
    window.addEventListener('storage', (e) => {
      if (e.key === 'student_verification') {
        this.checkStudentVerification();
      }
    });
  }
  
  async connect() {
    this.error = null;
    this.isLoading = true; // Activamos el estado de carga
    try {
      const acc = await this.wallet.connect();
      this.account = acc;
      this.chainId = await this.wallet.getChainId();
      this.updateLoanLimit();
    } catch (e: any) {
      this.error = e?.message || String(e);
    } finally {
      this.isLoading = false; // Desactivamos el estado de carga
    }
  }
  
  updateInterestRate() {
    this.interestRate = this.loanService.calculateInterestRate(this.loanForm.purposeType);
    this.calculateTotalAmount();
  }
  
  updateLoanLimit() {
    // Actualizar límite según la red seleccionada
    this.loanLimit = this.loanService.getLoanLimit(this.loanForm.network);
    console.log(`Límite actualizado para ${this.loanForm.network}: ${this.loanLimit} ETH`);
  }
  
  calculateTotalAmount() {
    if (this.loanForm.amount) {
      // Calcular tasa final con descuento por pago rápido
      this.calculateFinalInterestRate();
      this.totalAmount = this.loanForm.amount + (this.loanForm.amount * this.finalInterestRate);
    } else {
      this.totalAmount = 0;
    }
  }
  
  calculateFinalInterestRate() {
    // Aplicar descuentos por pago rápido
    if (this.loanForm.loanDuration === 7) {
      // 7 días: 2.5% de descuento
      this.hasDiscount = true;
      this.discountPercentage = 2.5;
      this.finalInterestRate = this.interestRate * (1 - 0.025); // Reducir 2.5%
    } else if (this.loanForm.loanDuration === 15) {
      // 15 días: 3% de descuento
      this.hasDiscount = true;
      this.discountPercentage = 3;
      this.finalInterestRate = this.interestRate * (1 - 0.03); // Reducir 3%
    } else {
      // Sin descuento para otras duraciones
      this.hasDiscount = false;
      this.discountPercentage = 0;
      this.finalInterestRate = this.interestRate;
    }
  }
  
  onAmountChange() {
    this.calculateTotalAmount();
  }
  
  onDurationChange() {
    this.calculateTotalAmount();
  }
  
  onNetworkChange() {
    this.updateLoanLimit();
  }
  
  onPurposeTypeChange() {
    this.updateInterestRate();
    
    // Si selecciona estudiante y no está verificado, mostrar alerta
    if (this.loanForm.purposeType === 'student' && !this.isStudentVerified) {
      Swal.fire({
        title: '🎓 Verificación Requerida',
        html: `
          <div style="text-align: left; padding: 15px;">
            <p style="margin-bottom: 15px; color: var(--text-primary);">
              Para acceder a la tasa preferencial de <strong>estudiantes (12%)</strong>, 
              necesitas verificar tu condición de estudiante.
            </p>
            <div style="background: var(--status-approved-bg); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid var(--status-approved-border);">
              <p style="margin: 5px 0; color: var(--text-primary); font-weight: 600;"><strong>📋 Requisitos:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px; color: var(--text-secondary);">
                <li>Correo institucional (&#64;MicroTrust.edu.pe)</li>
                <li>Código de estudiante</li>
                <li>Nombre de tu universidad</li>
                <li>Información de carrera</li>
              </ul>
            </div>
            <p style="color: var(--status-approved-text); margin-top: 15px; font-weight: 600;">
              ✓ El proceso solo toma 2 minutos
            </p>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '✓ Verificar Ahora',
        cancelButtonText: 'Más Tarde',
        confirmButtonColor: 'transparent',
        cancelButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal2-popup-custom',
          title: 'swal2-title-custom',
          htmlContainer: 'swal2-html-custom',
          confirmButton: 'swal2-confirm-custom',
          cancelButton: 'swal2-cancel-custom'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.openStudentVerification();
        }
      });
    }
  }
  
  checkStudentVerification() {
    const verification = localStorage.getItem('student_verification');
    if (verification) {
      try {
        this.studentVerificationData = JSON.parse(verification);
        this.isStudentVerified = this.studentVerificationData.status === 'verified';
      } catch (error) {
        this.isStudentVerified = false;
        this.studentVerificationData = null;
      }
    } else {
      this.isStudentVerified = false;
      this.studentVerificationData = null;
    }
  }
  
  getExplorerUrl(network: string, txHash: string): string {
    const explorers: { [key: string]: string } = {
      'holesky': 'https://holesky.etherscan.io/tx/',
      'sepolia': 'https://sepolia.etherscan.io/tx/',
      'goerli': 'https://goerli.etherscan.io/tx/',
      'ephemery': 'https://explorer.ephemery.dev/tx/',
      'hoodi': 'https://hoodi.etherscan.io//tx/'
    };
    return (explorers[network] || explorers['holesky']) + txHash;
  }

  openStudentVerification() {
    // Abrir ventana de verificación
    const width = 800;
    const height = 700;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    const verificationWindow = window.open(
      '/verificacion-estudiante',
      'VerificacionEstudiante',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
    
    if (!verificationWindow) {
      Swal.fire({
        title: '⚠️ Ventana Bloqueada',
        text: 'El navegador bloqueó la ventana de verificación. Por favor, permite ventanas emergentes e intenta nuevamente.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    } else {
      // Verificar periódicamente si se completó la verificación
      const checkInterval = setInterval(() => {
        if (verificationWindow.closed) {
          clearInterval(checkInterval);
          this.checkStudentVerification();
          
          if (this.isStudentVerified) {
            Swal.fire({
              title: '✅ Verificación Completada',
              text: 'Tu condición de estudiante ha sido verificada. Ahora tienes acceso a la tasa preferencial del 12%.',
              icon: 'success',
              confirmButtonText: '👍 Excelente',
              timer: 4000,
              timerProgressBar: true
            });
          }
        }
      }, 500);
    }
  }
  
  // Método para actualizar el tipo de propósito usando el objeto completo
  updatePurposeTypeWithType(type: PurposeTypeConfig) {
    // Verificamos que el valor sea uno de los tipos permitidos
    if (type.value === 'student' || type.value === 'business' || type.value === 'health' || type.value === 'events' || type.value === 'other') {
      this.loanForm.purposeType = type.value;
      this.onPurposeTypeChange();
    }
  }
  
  // Método para actualizar la red usando el objeto completo
  updateNetworkWithConfig(net: NetworkConfig) {
    // Verificamos que el valor sea uno de los tipos permitidos
    if (net.value === 'goerli' || net.value === 'holesky' || net.value === 'sepolia' || net.value === 'ephemery' || net.value === 'hoodi') {
      this.loanForm.network = net.value;
      this.onNetworkChange();
    }
  }
  
  async submitLoanRequest() {
    if (!this.account) {
      this.error = 'Debes conectar tu wallet primero';
      return;
    }
    
    // Validación de nombre completo (solo letras y espacios)
    if (!this.loanForm.borrowerName) {
      await Swal.fire({
        icon: 'error',
        title: 'Nombre Requerido',
        text: 'Debes ingresar tu nombre completo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional',
          confirmButton: 'swal-btn swal2-confirm-danger'
        }
      });
      return;
    }
    
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(this.loanForm.borrowerName)) {
      await Swal.fire({
        icon: 'error',
        title: 'Nombre Inválido',
        html: `
          <div style="text-align: left; padding: 1rem;">
            <p style="margin-bottom: 1rem;">El nombre completo solo puede contener:</p>
            <ul style="margin-left: 1.5rem; color: var(--text-secondary);">
              <li>Letras (a-z, A-Z)</li>
              <li>Letras con tildes (á, é, í, ó, ú)</li>
              <li>La letra ñ</li>
              <li>Espacios</li>
            </ul>
            <p style="margin-top: 1rem; color: #ef4444;">❌ No se permiten números ni caracteres especiales.</p>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional swal-wide',
          confirmButton: 'swal-btn swal2-confirm-danger'
        }
      });
      return;
    }
    
    // Validación de monto
    if (!this.loanForm.amount || this.loanForm.amount <= 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Monto Inválido',
        text: 'El monto del préstamo debe ser mayor a 0 ETH.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional',
          confirmButton: 'swal-btn swal2-confirm-danger'
        }
      });
      return;
    }
    
    // Validación de límite de red
    if (this.loanForm.amount > this.loanLimit) {
      await Swal.fire({
        icon: 'error',
        title: 'Monto Excede el Límite',
        html: `
          <div style="text-align: center; padding: 1rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
            <p style="font-size: 1.1rem; margin: 1rem 0;">No se puede enviar la solicitud porque el monto excede el límite permitido.</p>
            <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.3); margin: 1rem 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="color: var(--text-secondary);">Monto solicitado:</span>
                <span style="color: #ef4444; font-weight: 700; font-size: 1.2rem;">${this.loanForm.amount} ETH</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--text-secondary);">Límite de la red:</span>
                <span style="color: #10b981; font-weight: 700; font-size: 1.2rem;">${this.loanLimit} ETH</span>
              </div>
            </div>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 1rem;">
              Por favor, reduce el monto a <strong>${this.loanLimit} ETH</strong> o menos, o cambia a una red con mayor límite.
            </p>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional swal-wide',
          confirmButton: 'swal-btn swal2-confirm-warning'
        }
      });
      return;
    }
    
    // Validación de propósito (solo letras, números y espacios)
    if (!this.loanForm.purpose) {
      await Swal.fire({
        icon: 'error',
        title: 'Propósito Requerido',
        text: 'Debes especificar el propósito del préstamo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional',
          confirmButton: 'swal-btn swal2-confirm-danger'
        }
      });
      return;
    }
    
    const purposeRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,;:()¿?¡!-]+$/;
    if (!purposeRegex.test(this.loanForm.purpose)) {
      await Swal.fire({
        icon: 'error',
        title: 'Propósito Inválido',
        html: `
          <div style="text-align: left; padding: 1rem;">
            <p style="margin-bottom: 1rem;">El propósito del préstamo solo puede contener:</p>
            <ul style="margin-left: 1.5rem; color: var(--text-secondary);">
              <li>Letras (a-z, A-Z)</li>
              <li>Números (0-9)</li>
              <li>Letras con tildes (á, é, í, ó, ú)</li>
              <li>La letra ñ</li>
              <li>Espacios</li>
              <li>Signos de puntuación básicos (. , ; : - ¿ ? ¡ !)</li>
            </ul>
            <p style="margin-top: 1rem; color: #ef4444;">❌ No se permiten caracteres especiales como @, #, $, %, &, etc.</p>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional swal-wide',
          confirmButton: 'swal-btn swal2-confirm-danger'
        }
      });
      return;
    }
    
    // Verificar si seleccionó estudiante y no está verificado
    if (this.loanForm.purposeType === 'student' && !this.isStudentVerified) {
      this.error = 'Debes verificar tu condición de estudiante antes de continuar';
      
      Swal.fire({
        title: '⚠️ Verificación Requerida',
        text: 'Para acceder a la tasa de estudiante, primero debes verificar tu condición de estudiante.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '✓ Verificar Ahora',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: 'transparent',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        customClass: {
          popup: 'swal-professional',
          confirmButton: 'swal-btn swal2-confirm-custom',
          cancelButton: 'swal-btn swal2-cancel-custom'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.openStudentVerification();
        }
      });
      
      return;
    }
    
    try {
      this.isLoading = true;
      
      // Mostrar mensaje de espera
      Swal.fire({
        title: '⏳ Enviando a Blockchain',
        html: `
          <div style="text-align: center; padding: 1rem;">
            <p>Estamos registrando tu préstamo en la blockchain...</p>
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

      // 1. Registrar préstamo en el Smart Contract (BLOCKCHAIN)
      const interestRatePercent = Math.round(this.finalInterestRate * 100); // Convertir a porcentaje (ej: 0.12 -> 12)
      const blockchainResult = await this.smartContract.requestLoan(
        this.loanForm.amount!.toString(), // Monto en ETH
        interestRatePercent,              // Interés como porcentaje (ej: 12 para 12%)
        this.loanForm.loanDuration,       // Duración en días
        this.loanForm.purpose,            // Propósito
        this.loanForm.purposeType         // Tipo de propósito
      );

      if (!blockchainResult.success) {
        throw new Error(blockchainResult.message || 'Error al registrar en blockchain');
      }

      // 2. Guardar también localmente para la UI con información de blockchain
      const loanRequest = this.loanService.createLoanRequest({
        borrowerName: this.loanForm.borrowerName,
        borrowerAddress: this.account!,
        amount: this.loanForm.amount!,
        purpose: this.loanForm.purpose,
        purposeType: this.loanForm.purposeType,
        network: this.loanForm.network,
        interestRate: this.finalInterestRate,
        loanDuration: this.loanForm.loanDuration,
        transactionHash: blockchainResult.txHash,
        blockchainLoanId: blockchainResult.loanId
      });

      console.log('✅ Préstamo guardado localmente con blockchain ID:', loanRequest.blockchainLoanId);

      Swal.close();

      // Mostrar mensaje de éxito con información de blockchain
      const explorerUrl = this.getExplorerUrl(this.loanForm.network, blockchainResult.txHash!);
      await Swal.fire({
        title: '✅ ¡Préstamo Registrado en Blockchain!',
        html: `
          <div style="text-align: left; padding: 1rem;">
            <p style="margin-bottom: 1rem;">Tu préstamo ha sido registrado exitosamente en la blockchain.</p>
            <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
              <p style="margin: 0.5rem 0;"><strong>📝 ID del Préstamo:</strong> ${blockchainResult.loanId || 'N/A'}</p>
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
          confirmButton: 'swal-btn swal2-confirm-success'
        },
        didOpen: () => {
          const confirmBtn = Swal.getConfirmButton();
          if (confirmBtn) {
            confirmBtn.onclick = () => window.open(explorerUrl, '_blank');
          }
        }
      });
      
      // Limpiar formulario
      this.loanForm = {
        borrowerName: '',
        amount: null,
        purpose: '',
        purposeType: 'other',
        network: 'goerli',
        loanDuration: 7
      };
      
      this.totalAmount = 0;
      this.error = null;
    } catch (e: any) {
      Swal.close();
      this.error = e?.message || 'Error al enviar la solicitud de préstamo';
      
      await Swal.fire({
        title: '❌ Error al Registrar Préstamo',
        html: `
          <div style="text-align: left; padding: 1rem;">
            <p style="margin-bottom: 1rem;">${this.error}</p>
            <p style="color: var(--text-muted); font-size: 0.9rem;">
              Por favor, verifica que MetaMask esté conectado y que tengas suficiente balance para pagar la tarifa de gas.
            </p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      this.isLoading = false;
    }
  }
}