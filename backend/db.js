const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT, // 👈 IMPORTANTE
});

db.connect((err) => {
  if (err) {
    console.log("❌ Error conexión DB:", err);
  } else {
    console.log("✅ MySQL conectado");
  }
});

module.exports = db;
