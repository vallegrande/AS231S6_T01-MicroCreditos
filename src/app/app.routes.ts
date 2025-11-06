import { Routes } from '@angular/router';

// Componentes
import { LoginComponent } from './pages/login/login.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { StudentVerificationComponent } from './pages/student-verification/student-verification.component';
import { HomeComponent } from './pages/home/home.component';
import { DescripcionComponent } from './pages/descripcion/descripcion.component';
import { ObjetivosComponent } from './pages/objetivos/objetivos.component';
import { BeneficiosComponent } from './pages/beneficios/beneficios.component';
import { CaracteristicasComponent } from './pages/caracteristicas/caracteristicas.component';
import { EquipoComponent } from './pages/equipo/equipo.component';
import { SoporteComponent } from './pages/soporte/soporte.component';
import { LoanRequestComponent } from './pages/loan-request/loan-request.component';
import { MyLoansComponent } from './pages/my-loans/my-loans.component';
import { AdminComponent } from './pages/admin/admin.component';
import { ClientLayoutComponent } from './layouts/client-layout/client-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { ClientDashboardComponent } from './pages/client-dashboard/client-dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';

// Guards
import { AdminGuard } from './guards/admin.guard';
import { ClientGuard } from './guards/client.guard';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'auth/google/callback', component: AuthCallbackComponent },
  { path: 'auth/github/callback', component: AuthCallbackComponent },
  { path: 'verificacion-estudiante', component: StudentVerificationComponent },
  
  // Rutas públicas de la landing page (para visitantes sin conectar)
  { path: 'home', component: HomeComponent },
  { path: 'descripcion', component: DescripcionComponent },
  { path: 'objetivos', component: ObjetivosComponent },
  { path: 'beneficios', component: BeneficiosComponent },
  { path: 'caracteristicas', component: CaracteristicasComponent },
  { path: 'equipo', component: EquipoComponent },
  { path: 'soporte', component: SoporteComponent },
  
  // Rutas para el área de cliente
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [AuthGuard, ClientGuard],
    children: [
      { path: 'dashboard', component: ClientDashboardComponent },
      { path: 'home', component: HomeComponent },
      { path: 'descripcion', component: DescripcionComponent },
      { path: 'objetivos', component: ObjetivosComponent },
      { path: 'beneficios', component: BeneficiosComponent },
      { path: 'caracteristicas', component: CaracteristicasComponent },
      { path: 'equipo', component: EquipoComponent },
      { path: 'soporte', component: SoporteComponent },
      { path: 'solicitar-prestamo', component: LoanRequestComponent },
      { path: 'mis-prestamos', component: MyLoansComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  // Rutas para el área de administración
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: '', component: AdminComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  { path: '**', redirectTo: '' } // Ruta comodín
];