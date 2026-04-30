// Script para simular webhook de Mercado Pago localmente
require('dotenv').config();
const db = require('./db');

// Email del usuario que hizo el pago
const EMAIL_PRUEBA = 'cs7256081@gmail.com';
const PLAN_PRUEBA = 'estandar';

console.log('🧪 Simulando webhook de Mercado Pago...');
console.log(`📧 Email: ${EMAIL_PRUEBA}`);
console.log(`📦 Plan: ${PLAN_PRUEBA}`);

// Actualizar plan del usuario
db.query(
  "UPDATE usuarios SET plan=? WHERE email=?",
  [PLAN_PRUEBA, EMAIL_PRUEBA],
  (err, result) => {
    if (err) {
      console.error("❌ Error actualizando plan:", err.message);
      process.exit(1);
    }
    
    if (result.affectedRows === 0) {
      console.error("❌ Usuario no encontrado con ese email");
      process.exit(1);
    }
    
    console.log(`✅ Plan ${PLAN_PRUEBA} activado para ${EMAIL_PRUEBA}`);
    console.log(`✅ ${result.affectedRows} usuario(s) actualizado(s)`);
    
    // Verificar el cambio
    db.query(
      "SELECT email, plan FROM usuarios WHERE email=?",
      [EMAIL_PRUEBA],
      (err, rows) => {
        if (err) {
          console.error("❌ Error verificando:", err.message);
          process.exit(1);
        }
        
        console.log('\n📊 Estado actual:');
        console.table(rows);
        process.exit(0);
      }
    );
  }
);
