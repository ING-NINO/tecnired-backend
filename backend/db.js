const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456789",
  database: "soporte_usuarios",
});

db.connect((err) => {
  if (err) {
    console.log("Error al conectar:", err);
    return;
  }
  console.log("Conectado a MySQL");
});

module.exports = db;
