#!/bin/bash

# Script para manejar el proyecto Docker

case "$1" in
    "build")
        echo "🔨 Construyendo las imágenes Docker..."
        docker-compose build --no-cache
        ;;
    "up")
        echo "🚀 Iniciando los servicios..."
        docker-compose up -d
        echo "✅ Servicios iniciados!"
        echo "🌐 Frontend: http://localhost"
        echo "🔗 Backend: http://localhost:3001"
        echo "🗄️  MongoDB: mongodb://localhost:27017"
        ;;
    "down")
        echo "🛑 Deteniendo los servicios..."
        docker-compose down
        ;;
    "logs")
        if [ -z "$2" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f "$2"
        fi
        ;;
    "restart")
        echo "🔄 Reiniciando los servicios..."
        docker-compose restart
        ;;
    "clean")
        echo "🧹 Limpiando contenedores, imágenes y volúmenes..."
        docker-compose down -v
        docker system prune -f
        docker volume prune -f
        ;;
    "status")
        echo "📊 Estado de los servicios:"
        docker-compose ps
        ;;
    *)
        echo "🐳 Script de manejo Docker para Web Scraping"
        echo ""
        echo "Comandos disponibles:"
        echo "  build     - Construir las imágenes Docker"
        echo "  up        - Iniciar todos los servicios"
        echo "  down      - Detener todos los servicios"
        echo "  logs      - Ver logs (agregar nombre del servicio para logs específicos)"
        echo "  restart   - Reiniciar todos los servicios"
        echo "  clean     - Limpiar contenedores, imágenes y volúmenes"
        echo "  status    - Ver estado de los servicios"
        echo ""
        echo "Ejemplo: ./docker-manage.sh up"
        ;;
esac
