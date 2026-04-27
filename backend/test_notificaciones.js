// Script de prueba para verificar el sistema de notificaciones

const usuario = { 
  nombre: "michael vargas", 
  email: "michelandreyvargas2001@gmail.com" 
};

console.log("🧪 PRUEBA DEL SISTEMA DE NOTIFICACIONES");
console.log("=====================================");

async function probarSistema() {
  try {
    // 1. Obtener tickets del usuario
    console.log("1️⃣ Obteniendo tickets del usuario...");
    const resTickets = await fetch(`http://localhost:3000/tickets/usuario/${usuario.email}`);
    const tickets = await resTickets.json();
    console.log(`   ✅ Encontrados ${tickets.length} tickets`);
    
    const ticketsActivos = tickets.filter(t => t.estado !== "Finalizado");
    console.log(`   ✅ ${ticketsActivos.length} tickets activos`);
    
    if (ticketsActivos.length === 0) {
      console.log("   ❌ No hay tickets activos para probar");
      return;
    }
    
    // 2. Verificar mensajes en cada ticket
    console.log("\n2️⃣ Verificando mensajes en tickets activos...");
    for (const ticket of ticketsActivos) {
      console.log(`\n   📋 Ticket #${ticket.id}:`);
      
      const resChat = await fetch(`http://localhost:3000/chat/${ticket.id}`);
      const mensajes = await resChat.json();
      
      console.log(`      💬 Total mensajes: ${mensajes.length}`);
      
      // Mostrar todos los mensajes para debug
      mensajes.forEach((m, i) => {
        const esDelCliente = m.remitente === usuario.nombre || m.remitente === usuario.email;
        const tipo = esDelCliente ? "👤 Cliente" : "👨‍💼 Asesor";
        console.log(`      ${i+1}. ${tipo}: "${m.mensaje}" (${m.remitente})`);
      });
      
      const mensajesAsesor = mensajes.filter(m => {
        const esDelCliente = m.remitente === usuario.nombre || m.remitente === usuario.email;
        return !esDelCliente;
      });
      
      console.log(`      👨‍💼 Mensajes del asesor: ${mensajesAsesor.length}`);
    }
    
    console.log("\n✅ Prueba completada. Revisa los logs para verificar la detección.");
    
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  }
}

// Ejecutar la prueba si se ejecuta directamente
if (typeof window === 'undefined') {
  // Estamos en Node.js
  const fetch = require('node-fetch');
  probarSistema();
} else {
  // Estamos en el navegador
  window.probarSistemaNotificaciones = probarSistema;
  console.log("🔧 Para probar, ejecuta: probarSistemaNotificaciones()");
}