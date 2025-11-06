import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const isAuthenticated = this.authService.isAuthenticated();
    const isAdmin = this.authService.isAdmin();
    const user = this.authService.getCurrentUser();
    
    console.log('🛡️ AdminGuard verificando acceso:');
    console.log('- Está autenticado:', isAuthenticated);
    console.log('- Es admin:', isAdmin);
    console.log('- Usuario:', user);
    
    if (isAuthenticated && isAdmin) {
      console.log('✅ Acceso permitido al área de admin');
      return true;
    }

    console.log('❌ Acceso denegado - Redirigiendo a cliente');
    // Redirigir al dashboard de cliente si no es admin
    this.router.navigate(['/client/dashboard']);
    return false;
  }
}