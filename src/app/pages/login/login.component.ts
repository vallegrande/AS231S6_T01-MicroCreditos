import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../services/wallet.service';
import { AuthService, User } from '../../services/auth.service';
import { ThemeService } from '../../services/theme/theme.service';
import { APP_CONSTANTS } from '../../constants/app.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isLoadingGoogle = false;
  isLoadingGitHub = false;
  isLoadingWeb3 = false;
  error = '';
  account = '';
  chainId = '';
  isAdmin = false;

  constructor(
    private walletService: WalletService,
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated()) {
      this.redirectAfterLogin();
      return;
    }
    
    this.checkConnection();
  }

  async loginWithGoogle(): Promise<void> {
    this.isLoadingGoogle = true;
    this.error = '';
    
    try {
      const user = await this.authService.loginWithGoogle();
      console.log('Usuario logueado con Google:', user);
      this.redirectAfterLogin();
    } catch (error: any) {
      console.error('❌ Error Google login:', error);
      this.error = 'Error al conectar con Google: ' + error.message;
    } finally {
      this.isLoadingGoogle = false;
    }
  }

  async loginWithGitHub(): Promise<void> {
    this.isLoadingGitHub = true;
    this.error = '';
    
    try {
      const user = await this.authService.loginWithGitHub();
      console.log('Usuario logueado con GitHub:', user);
      this.redirectAfterLogin();
    } catch (error: any) {
      console.error('Error GitHub login:', error);
      this.error = 'Error al conectar con GitHub: ' + error.message;
    } finally {
      this.isLoadingGitHub = false;
    }
  }

  async loginWithWeb3(): Promise<void> {
    this.isLoadingWeb3 = true;
    this.error = '';
    
    try {
      const user = await this.authService.loginWithWeb3();
      console.log('Usuario logueado con Web3:', user);
      this.redirectAfterLogin();
    } catch (error: any) {
      this.error = 'Error al iniciar sesión con MetaMask: ' + error.message;
      console.error('Error Web3 login:', error);
    } finally {
      this.isLoadingWeb3 = false;
    }
  }

  // Método legacy para compatibilidad
  async connect(): Promise<void> {
    await this.loginWithWeb3();
  }

  async checkConnection(): Promise<void> {
    // Verificar si el usuario desconectó manualmente
    const manualDisconnect = localStorage.getItem('manual_disconnect');
    if (manualDisconnect === 'true') {
      console.log('Usuario desconectado manualmente, esperando nueva conexión');
      return;
    }
    
    try {
      const accounts = await this.walletService.getAccounts();
      if (accounts && accounts.length > 0) {
        this.account = accounts[0];
        this.chainId = await this.walletService.getChainId();
        this.checkAdminStatus();
        this.redirectAfterLogin();
      }
    } catch (error) {
      // No hay conexión activa
    }
  }

  private checkAdminStatus(): void {
    this.isAdmin = APP_CONSTANTS.ADMIN_ADDRESSES.some(
      adminAddr => adminAddr.toLowerCase() === this.account.toLowerCase()
    );
    
    console.log('🔍 Verificando status de admin (Login Component):');
    console.log('- Cuenta:', this.account);
    console.log('- Admin addresses:', APP_CONSTANTS.ADMIN_ADDRESSES);
    console.log('- Es admin:', this.isAdmin);
  }

  private redirectAfterLogin(): void {
    const user = this.authService.getCurrentUser();
    
    console.log('🔄 Redirigiendo usuario:');
    console.log('- Usuario:', user);
    console.log('- Es admin:', user?.isAdmin);
    
    if (user?.isAdmin) {
      console.log('✅ Redirigiendo a panel de admin');
      this.router.navigate(['/admin']);
    } else {
      console.log('✅ Redirigiendo a panel de cliente');
      this.router.navigate(['/client/dashboard']);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  // Método de prueba para verificar direcciones de admin
  testAdminAddresses(): void {
    console.log('🧪 VERIFICACIÓN DE DIRECCIONES DE ADMIN:');
    console.log('===========================================');
    console.log('Direcciones de admin configuradas:');
    APP_CONSTANTS.ADMIN_ADDRESSES.forEach((addr, index) => {
      console.log(`${index + 1}. ${addr}`);
    });
    
    if (this.account) {
      console.log('\nDirección actual conectada:', this.account);
      const isAdmin = APP_CONSTANTS.ADMIN_ADDRESSES.some(
        adminAddr => adminAddr.toLowerCase() === this.account.toLowerCase()
      );
      console.log('¿Es admin?', isAdmin);
      
      // Verificar también con el servicio de auth
      const user = this.authService.getCurrentUser();
      console.log('Usuario en AuthService:', user);
      console.log('¿AuthService dice que es admin?', user?.isAdmin);
    } else {
      console.log('No hay cuenta conectada');
    }
  }


}