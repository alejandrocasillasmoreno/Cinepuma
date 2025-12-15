// db.js
const mysql = require('mysql2/promise'); // Usamos 'promise' para Async/Await

// Configuración sensible, idealmente se lee de variables de entorno (.env)
const pool = mysql.createPool({
    host: 'localhost',      // O la IP de tu servidor de BD
    user: 'root',           // Tu usuario de MySQL
    password: 'your_mysql_password', // ¡Cámbiala!
    database: 'cinepuma_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Base de datos conectada.');

module.exports = pool;