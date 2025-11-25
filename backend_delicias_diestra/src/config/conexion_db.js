const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: '-05:00' // Zona horaria de Colombia (America/Bogota)
});

// Configurar la zona horaria al establecer conexión
db.getConnection()
  .then(connection => {
    connection.query("SET time_zone = '-05:00'");
    connection.release();
    console.log('✅ Zona horaria configurada: America/Bogota (UTC-5)');
  })
  .catch(err => {
    console.error('⚠️ Error al configurar zona horaria:', err.message);
  });

module.exports = db;
