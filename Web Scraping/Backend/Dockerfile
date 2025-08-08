# Usar imagen base de Node.js
FROM node:18-bullseye

# Instalar dependencias del sistema necesarias para Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libcups2 \
    libdrm2 \
    libgtk-3-0 \
    libxss1 \
    libgbm1 \
    libnss3 \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install --only=production

# Instalar navegadores de Playwright
RUN npx playwright install

# Copiar el resto del código
COPY . .

# Asegurar que el directorio de Tesseract existe y tiene permisos correctos
RUN mkdir -p /app/Utils/Tesseract && chmod 755 /app/Utils/Tesseract

# Puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]
