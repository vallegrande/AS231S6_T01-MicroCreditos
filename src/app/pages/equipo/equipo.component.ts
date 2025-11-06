import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-equipo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equipo.component.html',
  styleUrls: ['./equipo.component.css']
})
export class EquipoComponent {
  title = 'Nuestro Equipo';
  
  teamMembers = [
    {
      name: 'Víctor Cuaresma',
      role: 'Fundador & CEO',
      bio: 'Experto en blockchain y finanzas descentralizadas con más de 5 años de experiencia.',
      email: 'victorcuaresma@MicroTrust.com.pe',
      avatar: 'https://scontent-lim1-1.xx.fbcdn.net/v/t39.30808-6/532566583_122153126648709103_6023195608802821201_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEoURTCAA9r5Z4oGl5e79UuxpPzVXjqa-LGk_NVeOpr4lGuhxtSbgVoHoOOxs3MjaNv01Vjq7DgzSpqnnKTZGIT&_nc_ohc=d4B20LvY_YMQ7kNvwE3Vv0S&_nc_oc=AdnTTOaq5WD5kNgUVMFJcf3Wvo7KSTiZqSrfhLSE2NWBG2h2L8TqzHOpIK9yyqJ5V8Ew5inlJaxF5zf9J7WecTBC&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&_nc_gid=8L-LKa9e70pQn4n2pYL7Xw&oh=00_AfeqF0BXO9KY-jcDqiGLfTn9k20nk09B3Ky6LQ24SOAs1g&oe=690060F4'
    },
    {
      name: 'Ronaldinho Ccencho',
      role: 'Co-Fundador & Mano Derecha',
      bio: 'Especialista en tecnología blockchain y desarrollo de soluciones descentralizadas con amplia experiencia en fintech.',
      email: 'ronaldinhoccencho@MicroTrust.com.pe',
      avatar: 'https://scontent-lim1-1.xx.fbcdn.net/v/t39.30808-6/499794634_2400066920378564_7403014824113330908_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGOjsnCEmu_KItggOEh7FX41QTQXu_fP37VBNBe798_fv0I022EhwVyY5W4oOE0lpK3uslw5zVnnUIc1Ssu4Rs-&_nc_ohc=boT0m6zhfE8Q7kNvwHYxfS3&_nc_oc=AdlG35xEu07tOA2TYuxa3W-f4k73yYgQs7EU0BfAZFAe6_HtJ7jbMksCEUjdm8wEjFt7Rr8fePSH5JFAqC3vRb9y&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&_nc_gid=vi6-p8TBGZeENyYmM0SN7w&oh=00_AffZDYiwJJctakPmYhITxoZk8my5k_a-BMEEHZhAiO-8wg&oe=69007931'
    }
  ];
  
  advisors: any[] = [];
  
  onImageError(event: any) {
    // Si la imagen falla al cargar, mostrar un placeholder
    event.target.style.display = 'none';
    const placeholder = event.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }
}