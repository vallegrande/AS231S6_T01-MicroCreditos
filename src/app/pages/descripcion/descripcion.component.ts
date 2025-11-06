import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-descripcion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './descripcion.component.html',
  styleUrls: ['./descripcion.component.css']
})
export class DescripcionComponent {
  title = 'Descripción de MicroTrust';
  
  sections = [
    {
      title: '¿Qué es MicroTrust?',
      content: 'MicroTrust es una plataforma descentralizada de microcréditos que permite a personas sin acceso a servicios financieros tradicionales obtener préstamos de forma rápida, segura y transparente utilizando tecnología blockchain.'
    },
    {
      title: 'Nuestra Misión',
      content: 'Nuestra misión es democratizar el acceso al crédito, eliminando barreras tradicionales y proporcionando una alternativa confiable y accesible para todas las personas que necesitan financiamiento para sus proyectos personales o empresariales.'
    },
    {
      title: '¿Cómo Funciona?',
      content: 'Utilizamos la tecnología blockchain para crear contratos inteligentes que automatizan el proceso de préstamo. Los usuarios conectan sus wallets, solicitan préstamos y reciben los fondos directamente en sus cuentas una vez aprobados.'
    }
  ];
}