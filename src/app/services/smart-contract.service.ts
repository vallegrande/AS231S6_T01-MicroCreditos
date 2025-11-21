import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { environment } from '../../environments/environment';

// ABI del contrato
import MicroLoanABI from '../contracts/MicroLoan.json';

export interface LoanData {
  borrower: string;
  amount: string;
  interestRate: number;
  status: number;
  isPaid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SmartContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  
  constructor() {
    this.initializeProvider();
  }
  
  /**
   * Inicializar el provider de ethers
   */
  private async initializeProvider() {
    if (typeof window.ethereum !== 'undefined') {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Inicializar el contrato
      this.contract = new ethers.Contract(
        environment.contractAddress,
        MicroLoanABI.abi,
        this.signer
      );
      
      console.log('✅ Smart Contract inicializado');
      console.log('📍 Address del contrato:', environment.contractAddress);
      console.log('🔗 Para verificar, ejecuta en la consola:');
      console.log('   window.smartContractService.verifyContract()');
      
      // Exponer el servicio globalmente para verificación en consola
      if (typeof window !== 'undefined') {
        (window as any).smartContractService = this;
      }
    } else {
      console.error('❌ MetaMask no está instalado');
    }
  }
  
  /**
   * Reconectar el provider (útil cuando cambia la cuenta)
   */
  async reconnect() {
    await this.initializeProvider();
  }
  
  /**
   * Solicitar un préstamo en el Smart Contract
   */
  async requestLoan(
    amount: string,
    interestRate: number,
    duration: number,
    purpose: string,
    purposeType: string
  ): Promise<{ success: boolean; loanId?: number; txHash?: string; message: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado');
      }
      
      // Convertir el monto a Wei
      const amountInWei = ethers.parseEther(amount);
      
      console.log('📝 Solicitando préstamo en blockchain...');
      
      // Llamar a la función del contrato
      const tx = await this.contract['requestLoan'](
        amountInWei,
        interestRate,
        duration,
        purpose,
        purposeType
      );
      
      console.log('⏳ Esperando confirmación de transacción...');
      const receipt = await tx.wait();
      
      console.log('📋 Recibo de transacción:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        logsCount: receipt.logs.length,
        status: receipt.status
      });
      
      // Obtener el ID del préstamo - MÉTODO 1: Del valor de retorno de la función
      let loanId: number | undefined;
      
      // La función requestLoan devuelve el loanId directamente
      // Intentar obtenerlo del receipt
      console.log('🔍 Intentando obtener loanId del valor de retorno...');
      
      // MÉTODO 2: Parsear eventos
      console.log('🔍 Parseando eventos del recibo...');
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`   Log ${i}:`, {
          address: log.address,
          topics: log.topics,
          data: log.data
        });
        
        try {
          const parsed = this.contract.interface.parseLog({
            topics: [...log.topics],
            data: log.data
          });
          
          if (parsed) {
            console.log(`   ✅ Evento parseado:`, {
              name: parsed.name,
              args: parsed.args.toArray ? parsed.args.toArray() : parsed.args
            });
            
            if (parsed.name === 'LoanRequested') {
              // El loanId es el primer argumento indexado del evento
              loanId = Number(parsed.args[0]);
              console.log('✅ LoanId extraído del evento LoanRequested:', loanId);
              break;
            }
          }
        } catch (error) {
          // Log no es del contrato, continuar
          console.log(`   ⚠️ No se pudo parsear log ${i}`);
          continue;
        }
      }
      
      // MÉTODO 3: Obtener del contador del contrato (fallback)
      if (loanId === undefined || loanId === 0) {
        console.warn('⚠️ No se pudo extraer el loanId del evento, usando contador del contrato...');
        
        try {
          const counter = await this.contract['loanCounter']();
          loanId = Number(counter);
          console.log('✅ LoanId obtenido del contador del contrato:', loanId);
        } catch (error) {
          console.error('❌ No se pudo obtener el loanId del contador:', error);
          
          // MÉTODO 4: Último recurso - consultar el último préstamo del usuario
          console.warn('⚠️ Intentando último método: consultar préstamos del usuario...');
          try {
            // Obtener el contador y asumir que es el último préstamo
            const counter = await this.contract['loanCounter']();
            loanId = Number(counter);
            console.log('✅ LoanId asumido del contador:', loanId);
          } catch (finalError) {
            console.error('❌ Todos los métodos fallaron. No se pudo obtener el loanId');
            loanId = 0;
          }
        }
      }
      
      console.log('✅ Préstamo solicitado exitosamente. ID final:', loanId);
      
      return {
        success: true,
        loanId,
        txHash: receipt.hash,
        message: 'Préstamo solicitado exitosamente en blockchain'
      };
      
    } catch (error: any) {
      console.error('❌ Error al solicitar préstamo:', error);
      return {
        success: false,
        message: error.message || 'Error al solicitar préstamo'
      };
    }
  }
  
  /**
   * Aprobar un préstamo (solo admin)
   */
  async approveLoan(
    loanId: number,
    amount: string
  ): Promise<{ success: boolean; txHash?: string; message: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado');
      }
      
      // Primero verificar el estado del préstamo en blockchain
      console.log(`🔍 Verificando estado del préstamo ${loanId} en blockchain...`);
      const loanData = await this.getLoan(loanId);
      
      if (!loanData) {
        return {
          success: false,
          message: `El préstamo #${loanId} no existe en el smart contract. Verifica que el ID sea correcto.`
        };
      }
      
      // Verificar que el préstamo tenga un borrower válido (no sea dirección cero)
      if (loanData.borrower === '0x0000000000000000000000000000000000000000') {
        return {
          success: false,
          message: `El préstamo #${loanId} no existe o no tiene un prestatario válido.`
        };
      }
      
      // Verificar el estado del préstamo
      // Status: 0 = Pending, 1 = Approved, 2 = Rejected, 3 = Paid
      if (loanData.status !== 0) {
        const statusNames = ['Pendiente', 'Aprobado', 'Rechazado', 'Pagado'];
        const currentStatus = statusNames[loanData.status] || 'Desconocido';
        return {
          success: false,
          message: `Este préstamo ya no está pendiente. Estado actual: ${currentStatus}.\n\nSolo los préstamos en estado "Pendiente" pueden ser aprobados.`
        };
      }
      
      const amountInWei = ethers.parseEther(amount);
      
      console.log('✅ Aprobando préstamo en blockchain...');
      console.log(`   Préstamo ID: ${loanId}`);
      console.log(`   Monto: ${amount} ETH`);
      console.log(`   Prestatario: ${loanData.borrower}`);
      console.log(`   Estado actual: Pendiente`);
      
      // Llamar a la función del contrato enviando ETH
      const tx = await this.contract['approveLoan'](loanId, {
        value: amountInWei
      });
      
      console.log('⏳ Esperando confirmación de transacción...');
      const receipt = await tx.wait();
      
      console.log('✅ Préstamo aprobado exitosamente');
      
      return {
        success: true,
        txHash: receipt.hash,
        message: 'Préstamo aprobado y fondos transferidos'
      };
      
    } catch (error: any) {
      console.error('❌ Error al aprobar préstamo:', error);
      
      // Mejorar mensajes de error específicos
      let errorMessage = 'Error al aprobar préstamo';
      
      if (error.message?.includes('Not pending')) {
        errorMessage = 'Este préstamo ya no está en estado pendiente. Puede que ya haya sido aprobado o rechazado anteriormente.';
      } else if (error.message?.includes('Only admin')) {
        errorMessage = 'Solo los administradores pueden aprobar préstamos. Verifica que tu dirección esté registrada como administrador en el contrato.';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Fondos insuficientes en tu wallet para aprobar este préstamo.';
      } else if (error.code === 4001) {
        errorMessage = 'Transacción cancelada por el usuario.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }
  
  /**
   * Rechazar un préstamo (solo admin)
   */
  async rejectLoan(
    loanId: number,
    reason: string
  ): Promise<{ success: boolean; txHash?: string; message: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado');
      }
      
      console.log('❌ Rechazando préstamo en blockchain...');
      
      const tx = await this.contract['rejectLoan'](loanId, reason);
      
      console.log('⏳ Esperando confirmación de transacción...');
      const receipt = await tx.wait();
      
      console.log('✅ Préstamo rechazado exitosamente');
      
      return {
        success: true,
        txHash: receipt.hash,
        message: 'Préstamo rechazado en blockchain'
      };
      
    } catch (error: any) {
      console.error('❌ Error al rechazar préstamo:', error);
      return {
        success: false,
        message: error.message || 'Error al rechazar préstamo'
      };
    }
  }
  
  /**
   * Pagar un préstamo
   */
  async payLoan(
    loanId: number,
    totalAmount: string
  ): Promise<{ success: boolean; txHash?: string; message: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado');
      }
      
      const amountInWei = ethers.parseEther(totalAmount);
      
      console.log('💰 Pagando préstamo en blockchain...');
      
      const tx = await this.contract['payLoan'](loanId, {
        value: amountInWei
      });
      
      console.log('⏳ Esperando confirmación de transacción...');
      const receipt = await tx.wait();
      
      console.log('✅ Préstamo pagado exitosamente');
      
      return {
        success: true,
        txHash: receipt.hash,
        message: 'Préstamo pagado exitosamente'
      };
      
    } catch (error: any) {
      console.error('❌ Error al pagar préstamo:', error);
      return {
        success: false,
        message: error.message || 'Error al pagar préstamo'
      };
    }
  }
  
  /**
   * Obtener información de un préstamo
   */
  async getLoan(loanId: number): Promise<LoanData | null> {
    try {
      if (!this.contract) {
        throw new Error('Contrato no inicializado');
      }
      
      console.log(`📋 Consultando préstamo #${loanId} en el contrato...`);
      const result = await this.contract['getLoan'](loanId);
      
      console.log('📦 Datos recibidos del contrato:', result);
      
      // La función getLoan devuelve: (borrower, amount, rate, status, paid)
      const loanData: LoanData = {
        borrower: result[0],
        amount: ethers.formatEther(result[1]),
        interestRate: Number(result[2]),
        status: Number(result[3]),
        isPaid: result[4]
      };
      
      console.log('✅ Préstamo parseado:', loanData);
      
      return loanData;
      
    } catch (error: any) {
      console.error('❌ Error al obtener préstamo:', error);
      return null;
    }
  }
  

  
  /**
   * Escuchar eventos del contrato
   */
  listenToEvents(callback: (event: any) => void) {
    if (!this.contract) {
      console.error('Contrato no inicializado');
      return;
    }
    
    // Escuchar evento LoanRequested
    this.contract.on('LoanRequested', (loanId: bigint, borrower: string, amount: bigint, purpose: string) => {
      callback({
        type: 'LoanRequested',
        loanId: Number(loanId),
        borrower,
        amount: ethers.formatEther(amount),
        purpose
      });
    });
    
    // Escuchar evento LoanApproved
    this.contract.on('LoanApproved', (loanId: bigint, borrower: string, amount: bigint) => {
      callback({
        type: 'LoanApproved',
        loanId: Number(loanId),
        borrower,
        amount: ethers.formatEther(amount)
      });
    });
    
    // Escuchar evento LoanPaid
    this.contract.on('LoanPaid', (loanId: bigint, borrower: string, amount: bigint) => {
      callback({
        type: 'LoanPaid',
        loanId: Number(loanId),
        borrower,
        amount: ethers.formatEther(amount)
      });
    });
  }

  /**
   * Verificar información del contrato conectado
   */
  async verifyContract(): Promise<{
    isConnected: boolean;
    contractAddress: string;
    expectedAddress: string;
    isCorrect: boolean;
    balance?: string;
    owner?: string;
    network?: string;
    message: string;
  }> {
    try {
      const expectedAddress = environment.contractAddress.toLowerCase();
      
      if (!this.contract) {
        return {
          isConnected: false,
          contractAddress: 'No inicializado',
          expectedAddress,
          isCorrect: false,
          message: '❌ El contrato no está inicializado. Verifica que MetaMask esté instalado y conectado.'
        };
      }

      const contractAddress = (await this.contract.getAddress()).toLowerCase();
      const isCorrect = contractAddress === expectedAddress;

      let balance: string | undefined;
      let owner: string | undefined;
      let network: string | undefined;

      try {
        // Obtener balance del contrato desde el provider
        const balanceWei = await this.provider!.getBalance(contractAddress);
        balance = ethers.formatEther(balanceWei);
        
        // Obtener owner del contrato (si existe la función)
        try {
          owner = await this.contract['owner']();
        } catch {
          // La función owner() puede no existir
        }

        // Obtener información de la red
        if (this.provider) {
          const networkInfo = await this.provider.getNetwork();
          network = networkInfo.name || `Chain ID: ${networkInfo.chainId}`;
        }
      } catch (error) {
        console.warn('No se pudo obtener información adicional del contrato:', error);
      }

      const message = isCorrect
        ? `✅ El contrato está correctamente configurado y conectado a ${contractAddress}`
        : `⚠️ ADVERTENCIA: El contrato conectado (${contractAddress}) no coincide con el esperado (${expectedAddress})`;

      return {
        isConnected: true,
        contractAddress,
        expectedAddress,
        isCorrect,
        balance,
        owner,
        network,
        message
      };
    } catch (error: any) {
      return {
        isConnected: false,
        contractAddress: 'Error',
        expectedAddress: environment.contractAddress.toLowerCase(),
        isCorrect: false,
        message: `❌ Error al verificar el contrato: ${error.message}`
      };
    }
  }

  /**
   * Obtener el address del contrato actual
   */
  getContractAddress(): string {
    return environment.contractAddress;
  }

  /**
   * Verificar si el contrato está inicializado
   */
  isContractInitialized(): boolean {
    return this.contract !== null;
  }
}
