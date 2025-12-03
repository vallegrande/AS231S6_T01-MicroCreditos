# 🐳 Docker - Guía de Uso

## Archivos Creados

- **Dockerfile**: Configuración multi-stage para construir y servir la aplicación
- **docker-compose.yml**: Orquestación de contenedores
- **.dockerignore**: Optimización del contexto de build
- **nginx.conf**: Configuración de Nginx con optimizaciones

## 📋 Características

### Dockerfile Multi-Stage
- **Stage 1 (Build)**: Usa Node.js 18 Alpine para construir la aplicación Angular
- **Stage 2 (Production)**: Usa Nginx Alpine para servir los archivos estáticos
- **Healthcheck**: Verificación automática del estado del contenedor
- **Optimizado**: Imagen final ligera (~50MB)

### Nginx Configuration
- ✅ Compresión Gzip habilitada
- ✅ Headers de seguridad (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- ✅ Caché de assets estáticos (1 año)
- ✅ Soporte para routing de Angular (SPA)
- ✅ Endpoint de health check en `/health`

## 🚀 Comandos Docker

### Construir la imagen
```bash
docker build -t microcreditos-app .
```

### Ejecutar el contenedor
```bash
docker run -d -p 80:80 --name microcreditos microcreditos-app
```

### Usar Docker Compose (Recomendado)
```bash
# Construir y ejecutar
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down

# Reconstruir
docker compose up -d --build
```

## 🔍 Verificación

### Verificar que el contenedor está corriendo
```bash
docker ps
```

### Ver logs del contenedor
```bash
docker logs microcreditos-frontend
```

### Probar el health check
```bash
curl http://localhost/health
```

### Acceder a la aplicación
Abre tu navegador en: `http://localhost`

## 🛠️ Troubleshooting

### El contenedor no inicia
```bash
# Ver logs detallados
docker compose logs frontend

# Verificar el estado
docker compose ps
```

### Reconstruir desde cero
```bash
# Eliminar contenedores, volúmenes e imágenes
docker compose down -v
docker rmi microcreditos-app

# Reconstruir
docker compose up -d --build
```

### Acceder al contenedor
```bash
docker exec -it microcreditos-frontend sh
```

## 📦 Optimizaciones Implementadas

1. **Multi-stage build**: Reduce el tamaño de la imagen final
2. **Alpine Linux**: Imágenes base más ligeras
3. **npm ci**: Instalación más rápida y determinista
4. **Gzip compression**: Reduce el tamaño de transferencia
5. **Static asset caching**: Mejora el rendimiento
6. **Health checks**: Monitoreo automático del estado

## 🔒 Seguridad

- Usuario no-root en Nginx
- Headers de seguridad configurados
- Sin información sensible en la imagen
- Healthcheck para detección de problemas

## 📝 Notas

- El puerto por defecto es **80**, puedes cambiarlo en `docker-compose.yml`
- Los archivos se sirven desde `/usr/share/nginx/html`
- La configuración de producción de Angular se usa automáticamente
- El health check está disponible en `/health`
