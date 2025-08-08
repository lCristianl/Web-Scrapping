# Script simple para verificar Docker
param([string]$action)

switch ($action) {
    "status" {
        Write-Host "=== Estado de Docker ===" -ForegroundColor Green
        docker --version
        docker-compose --version
        Write-Host "`n=== Contenedores en ejecución ===" -ForegroundColor Green
        docker ps
    }
    "build" {
        Write-Host "=== Construyendo imágenes ===" -ForegroundColor Yellow
        docker-compose build --no-cache
    }
    "up" {
        Write-Host "=== Iniciando servicios ===" -ForegroundColor Green
        docker-compose up -d
        Write-Host "`nServicios disponibles:" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost" -ForegroundColor White
        Write-Host "Backend: http://localhost:3001" -ForegroundColor White
        Write-Host "MongoDB: mongodb://localhost:27017" -ForegroundColor White
    }
    "down" {
        Write-Host "=== Deteniendo servicios ===" -ForegroundColor Red
        docker-compose down
    }
    "logs" {
        Write-Host "=== Logs de todos los servicios ===" -ForegroundColor Blue
        docker-compose logs
    }
    "test" {
        Write-Host "=== Probando conectividad ===" -ForegroundColor Magenta
        
        Write-Host "`nProbando frontend..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5
            Write-Host "Frontend: OK (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "Frontend: Error - $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "`nProbando backend..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
            Write-Host "Backend: OK (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "Backend: Error - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    default {
        Write-Host "=== Verificador Docker para Web Scraping ===" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Uso: .\verify-docker.ps1 [accion]" -ForegroundColor White
        Write-Host ""
        Write-Host "Acciones disponibles:" -ForegroundColor Yellow
        Write-Host "  status  - Ver estado de Docker y contenedores"
        Write-Host "  build   - Construir imágenes"
        Write-Host "  up      - Iniciar servicios"
        Write-Host "  down    - Detener servicios"
        Write-Host "  logs    - Ver logs"
        Write-Host "  test    - Probar conectividad de servicios"
    }
}
