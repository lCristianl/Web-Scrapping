# Multi-stage build para optimizar el tamaño de la imagen

# Stage 1: Build de la aplicación
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Stage 2: Servidor de producción
FROM nginx:alpine

# Crear directorio para configuración personalizada
RUN mkdir -p /etc/nginx/conf.d

# Copiar configuración personalizada desde el contexto de construcción
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar los archivos construidos desde el stage builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Comando por defecto de Nginx
CMD ["nginx", "-g", "daemon off;"]
