// Script para ver todos los usuarios registrados
require('dotenv').config();
const db = require('./db');

console.log('📋 Consultando usuarios registrados...\n');

db.query(
  "SELECT id, nombre, email, plan, rol FROM usuarios ORDER BY id DESC LIMIT 10",
  (err, rows) => {
    if (err) {
      console.error("❌ Error consultando usuarios:", err.message);
      process.exit(1);
    }
    
    if (rows.length === 0) {
      console.log("⚠️ No hay usuarios registrados");
      process.exit(0);
    }
    
    console.log(`✅ ${rows.length} usuario(s) encontrado(s):\n`);
    console.table(rows);
    
    console.log('\n💡 Usa el email del usuario que quieres actualizar');
    process.exit(0);
  }
);
