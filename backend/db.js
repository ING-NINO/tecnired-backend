const mysql = require("mysql2");

// Usar pool en lugar de conexión simple
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000
});

// Probar la conexión
pool.getConnection((err, connection) => {
  if (err) {
    console.log("❌ Error conexión DB:", err.message);
    console.log("Host:", process.env.DB_HOST);
    console.log("Port:", process.env.DB_PORT);
    console.log("Database:", process.env.DB_NAME);
    console.log("User:", process.env.DB_USER);
  } else {
    console.log("✅ MySQL conectado a Railway");
    console.log("📍 Host:", process.env.DB_HOST);
    console.log("📦 Database:", process.env.DB_NAME);
    connection.release();
  }
});

module.exports = pool;
