import { Component, OnInit, DoCheck, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { APP_CONSTANTS } from '../../constants/app.constants';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, DoCheck, OnDestroy {
  title = 'MicroTrust';
  subtitle = 'Plataforma de Microcréditos Descentralizada';
  account: string | null = null;
  isAdmin: boolean = false;
  isLoading: boolean = false;
  private redirectTimeout: any;
  
  features = [
    {
      title: 'Préstamos Rápidos',
      description: 'Obtén préstamos en minutos directamente a tu wallet'
    },
    {
      title: 'Transparencia Total',
      description: 'Todos los términos y condiciones visibles en blockchain'
    },
    {
      title: 'Bajos Intereses',
      description: 'Tasas competitivas adaptadas a tus necesidades'
    },
    {
      title: 'Sin Garantías',
      description: 'Accede a créditos sin necesidad de aval ni garantía'
    }
  ];

  constructor(
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkConnection();
    // Verificar inmediatamente si es admin
    if (this.account && this.isAdmin) {
      this.router.navigate(['/admin']);
    }
    
    // Agregar efecto visual al cargar la página
    this.addPageLoadEffect();
  }

  ngDoCheck() {
    // Verificar continuamente si es admin para redirigir
    if (this.account && this.isAdmin && this.router.url !== '/admin') {
      this.router.navigate(['/admin']);
    }
  }

  ngOnDestroy() {
    // Limpiar timeout si el componente se destruye
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  async checkConnection() {
    try {
      const accounts = await this.walletService.getAccounts();
      if (accounts && accounts.length > 0) {
        this.account = accounts[0];
        this.checkAdminStatus();
        // Redirección automática después de verificar la cuenta
        this.redirectBasedOnRole(false); // false = no mostrar mensaje
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  }

  async connect() {
    this.isLoading = true;
    try {
      this.account = await this.walletService.connect();
      if (this.account) {
        this.checkAdminStatus();
        // Redirección automática después de login
        this.redirectBasedOnRole(true); // true = mostrar mensaje
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // Mostrar mensaje de error al usuario
      await Swal.fire({
        title: 'Error',
        text: 'Error al conectar con MetaMask. Por favor, asegúrate de tener la extensión instalada y desbloqueada.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      this.isLoading = false;
    }
  }

  disconnect() {
    // En una implementación real, aquí se desconectaría la wallet
    // Por ahora, simplemente limpiamos el estado local
    this.account = null;
    this.isAdmin = false;
    // Cancelar cualquier redirección pendiente
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
    // Recargar la página para reflejar el cambio
    window.location.reload();
  }

  checkAdminStatus() {
    if (this.account) {
      // Comparación insensible a mayúsculas/minúsculas
      this.isAdmin = APP_CONSTANTS.ADMIN_ADDRESSES.some(adminAddress => 
        adminAddress.toLowerCase() === this.account?.toLowerCase()
      );
    }
  }

  redirectBasedOnRole(showMessage: boolean) {
    // Redirección automática después de login
    if (showMessage) {
      // Mostrar mensaje de redirección
      this.redirectTimeout = setTimeout(() => {
        if (this.isAdmin) {
          this.router.navigate(['/admin']);
        } else if (this.account) {
          // Para clientes, podemos mostrar la página principal con acceso a funcionalidades
          // o redirigir directamente a solicitar préstamo
          this.router.navigate(['/solicitar-prestamo']);
        }
      }, 1500);
    } else {
      // Redirección inmediata sin mensaje
      if (this.isAdmin) {
        this.router.navigate(['/admin']);
      } else if (this.account) {
        // Para clientes, mostramos la página principal con acceso a funcionalidades
        // No redirigimos automáticamente para que puedan ver la información
      }
    }
  }
  
  private addPageLoadEffect() {
    // Agregar clase para animación de entrada
    const container = document.querySelector('.home-container');
    if (container) {
      container.classList.add('page-loaded');
    }
    
    // Agregar efecto de partículas de fondo
    this.createBackgroundParticles();
  }
  
  private createBackgroundParticles() {
    // Esta función crearía un efecto visual de partículas en el fondo
    // En una implementación real, se podría usar una librería como particles.js
    // Por ahora, solo agregamos una clase para efectos CSS
    const container = document.querySelector('.home-container');
    if (container) {
      container.classList.add('particles-effect');
    }
  }
}