import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-caracteristicas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './caracteristicas.component.html',
  styleUrls: ['./caracteristicas.component.css']
})
export class CaracteristicasComponent {
  title = 'Características de MicroTrust';
  
  technicalFeatures = [
    {
      title: 'Integración Blockchain',
      description: 'Conexión directa con wallets de Ethereum y redes de prueba'
    },
    {
      title: 'Contratos Inteligentes',
      description: 'Automatización de procesos mediante smart contracts'
    },
    {
      title: 'Generación de Contratos',
      description: 'Creación automática de contratos PDF con código QR único'
    },
    {
      title: 'Multi-Red',
      description: 'Soporte para Goerli, Sepolia, Holešky y Ephemery'
    },
    {
      title: 'Sistema de Roles',
      description: 'Diferenciación entre usuarios y administradores'
    },
    {
      title: 'Panel de Administración',
      description: 'Interfaz dedicada para aprobación de préstamos'
    }
  ];
  
  userFeatures = [
    {
      title: 'Solicitud Simple',
      description: 'Formulario intuitivo para solicitar préstamos'
    },
    {
      title: 'Seguimiento en Tiempo Real',
      description: 'Estado actualizado de tus solicitudes de préstamo'
    },
    {
      title: 'Descarga de Contratos',
      description: 'Acceso inmediato a contratos en formato PDF'
    },
    {
      title: 'Tasas Adaptativas',
      description: 'Intereses según el propósito del préstamo'
    },
    {
      title: 'Límites por Nivel',
      description: 'Límites ajustados según experiencia del usuario'
    },
    {
      title: 'Soporte Multilingüe',
      description: 'Interfaz disponible en múltiples idiomas'
    }
  ];
}