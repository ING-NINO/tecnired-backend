// Script para verificar el último pago y actualizar el plan manualmente
require('dotenv').config();
const { MercadoPagoConfig, Payment } = require("mercadopago");
const db = require('./db');

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

console.log('🔍 Verificando últimos pagos en Mercado Pago...\n');

async function verificarPagos() {
  try {
    const payment = new Payment(mpClient);
    
    // Obtener los últimos pagos (esto puede variar según la API de MP)
    console.log('📊 Consultando pagos recientes...\n');
    
    // Consultar pagos en la base de datos
    db.query(
      "SELECT * FROM pagos ORDER BY fecha DESC LIMIT 5",
      (err, pagos) => {
        if (err) {
          console.error("❌ Error consultando pagos:", err.message);
          process.exit(1);
        }
        
        if (pagos.length === 0) {
          console.log("⚠️ No hay pagos registrados en la base de datos");
          console.log("\n💡 Esto significa que el webhook NO está llegando o NO está procesando correctamente");
          process.exit(0);
        }
        
        console.log(`✅ ${pagos.length} pago(s) encontrado(s) en la BD:\n`);
        console.table(pagos);
        
        // Verificar usuarios
        console.log('\n👥 Verificando planes de usuarios...\n');
        
        const emails = [...new Set(pagos.map(p => p.email))];
        
        emails.forEach(email => {
          db.query(
            "SELECT email, plan FROM usuarios WHERE email = ?",
            [email],
            (err, usuarios) => {
              if (err) {
                console.error(`❌ Error consultando usuario ${email}:`, err.message);
                return;
              }
              
              if (usuarios.length === 0) {
                console.log(`⚠️ Usuario no encontrado: ${email}`);
                return;
              }
              
              const usuario = usuarios[0];
              const pagoUsuario = pagos.find(p => p.email === email);
              
              console.log(`📧 ${email}`);
              console.log(`   Plan actual: ${usuario.plan}`);
              console.log(`   Plan pagado: ${pagoUsuario.plan}`);
              
              if (usuario.plan !== pagoUsuario.plan) {
                console.log(`   ⚠️ DESINCRONIZADO - Actualizando...`);
                
                db.query(
                  "UPDATE usuarios SET plan = ? WHERE email = ?",
                  [pagoUsuario.plan, email],
                  (err) => {
                    if (err) {
                      console.error(`   ❌ Error actualizando: ${err.message}`);
                    } else {
                      console.log(`   ✅ Plan actualizado a: ${pagoUsuario.plan}`);
                    }
                  }
                );
              } else {
                console.log(`   ✅ Sincronizado correctamente`);
              }
              
              console.log('');
            }
          );
        });
        
        setTimeout(() => {
          process.exit(0);
        }, 2000);
      }
    );
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

verificarPagos();
