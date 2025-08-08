// Script de inicialización para MongoDB
db = db.getSiblingDB('webscraping');

// Crear usuario para la aplicación
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [
    {
      role: 'readWrite',
      db: 'webscraping'
    }
  ]
});

// Crear colecciones básicas si es necesario
db.createCollection('consultas');
db.createCollection('resultados');

print('Base de datos inicializada correctamente');
