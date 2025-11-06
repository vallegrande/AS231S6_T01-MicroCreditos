import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-beneficios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './beneficios.component.html',
  styleUrls: ['./beneficios.component.css']
})
export class BeneficiosComponent {
  title = 'Beneficios de MicroTrust';
  
  userBenefits = [
    {
      icon: '💰',
      title: 'Acceso al Crédito',
      description: 'Obtén préstamos sin necesidad de historial crediticio tradicional'
    },
    {
      icon: '⏱️',
      title: 'Proceso Rápido',
      description: 'Solicita y recibe tu préstamo en cuestión de horas'
    },
    {
      icon: '📱',
      title: '100% Digital',
      description: 'Todo el proceso se realiza desde tu dispositivo móvil o computadora'
    },
    {
      icon: '🔒',
      title: 'Seguridad Blockchain',
      description: 'Tus datos y transacciones están protegidos por tecnología blockchain'
    },
    {
      icon: '📉',
      title: 'Bajos Intereses',
      description: 'Tasas competitivas adaptadas a tus necesidades y perfil'
    },
    {
      icon: '🌐',
      title: 'Acceso Global',
      description: 'Opera desde cualquier lugar del mundo con conexión a internet'
    }
  ];
  
  platformBenefits = [
    {
      title: 'Transparencia Total',
      description: 'Todos los términos y condiciones son visibles y verificables en blockchain'
    },
    {
      title: 'Automatización',
      description: 'Contratos inteligentes que ejecutan automáticamente los términos acordados'
    },
    {
      title: 'Reducción de Costos',
      description: 'Menos intermediarios significan menores costos operativos'
    },
    {
      title: 'Inclusión Financiera',
      description: 'Brindamos acceso a servicios financieros a personas no bancarizadas'
    }
  ];
}