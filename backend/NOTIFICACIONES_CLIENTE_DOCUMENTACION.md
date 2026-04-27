# 🔔 Sistema de Notificaciones para Clientes - Documentación

## ✅ Funcionalidad Implementada

El cliente ahora recibe **notificaciones visuales y sonoras** cuando el asesor le escribe un mensaje en el chat.

---

## 🎯 Características

### 1. **Badge de Notificaciones en el Header**
- ✅ Aparece en la parte superior del panel del cliente
- ✅ Muestra el número de mensajes nuevos sin leer
- ✅ Color rojo llamativo para captar la atención
- ✅ Icono de campana con animación de balanceo

### 2. **Detección Automática de Mensajes Nuevos**
- ✅ Verifica cada 30 segundos si hay mensajes nuevos
- ✅ Solo cuenta mensajes del asesor (no los del cliente)
- ✅ Funciona para todos los tickets activos simultáneamente

### 3. **Notificación Sonora**
- ✅ Reproduce un sonido suave cuando llega un mensaje nuevo
- ✅ Usa Web Audio API (no requiere archivos de audio)
- ✅ Tono agradable y no intrusivo

### 4. **Animación Visual**
- ✅ La campana se balancea para llamar la atención
- ✅ Animación CSS suave y profesional

---

## 🎨 Interfaz Visual

### Badge de Notificaciones:
```
┌─────────────────────────────────┐
│ 🔔 3 Nuevos mensajes            │
└─────────────────────────────────┘
```

**Ubicación**: En el header, a la izquierda del botón "Herramientas"

**Colores**:
- Fondo: Rojo suave (rgba(239,68,68,0.15))
- Borde: Rojo (rgba(239,68,68,0.3))
- Texto: Rojo (#ef4444)

---

## 🔧 Funcionamiento Técnico

### Flujo de Detección:

1. **Cada 30 segundos**, el sistema:
   - Obtiene todos los tickets activos del cliente
   - Para cada ticket, consulta los mensajes del chat
   - Filtra solo los mensajes del asesor
   - Compara con el contador anterior

2. **Si hay mensajes nuevos**:
   - Actualiza el contador en el badge
   - Muestra el badge (si estaba oculto)
   - Reproduce el sonido de notificación

3. **Cuando el cliente hace clic en el badge**:
   - Muestra un alert informativo
   - Oculta el badge temporalmente

### Variables de Estado:

```javascript
let ultimosMensajes = {
  1: 5,  // Ticket #1 tiene 5 mensajes del asesor
  3: 2,  // Ticket #3 tiene 2 mensajes del asesor
  // ...
};
```

---

## 📊 Lógica de Conteo

### Ejemplo de Funcionamiento:

**Situación Inicial:**
- Ticket #1: 3 mensajes del asesor
- Ticket #2: 1 mensaje del asesor
- Badge: Oculto

**El asesor escribe en Ticket #1:**
- Ticket #1: 4 mensajes del asesor (1 nuevo)
- Badge: "🔔 1 Nuevos mensajes"
- Sonido: ✅ Reproducido

**El asesor escribe en Ticket #2:**
- Ticket #2: 2 mensajes del asesor (1 nuevo)
- Badge: "🔔 2 Nuevos mensajes"
- Sonido: ✅ Reproducido

**El cliente hace clic en el badge:**
- Badge: Oculto
- Contadores: Reiniciados

---

## 🎵 Sonido de Notificación

### Características del Sonido:
- **Frecuencia**: 800 Hz (tono medio-alto)
- **Duración**: 0.3 segundos
- **Volumen**: 30% (suave)
- **Tipo**: Onda sinusoidal (tono puro)

### Código del Sonido:
```javascript
function reproducirSonidoNotificacion() {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.frequency.value = 800;
  oscillator.type = "sine";
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
}
```

---

## 🎬 Animación CSS

### Animación de Balanceo:
```css
@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-10deg); }
  20%, 40% { transform: rotate(10deg); }
}
```

**Aplicación**: La campana se balancea de -10° a +10° continuamente

---

## 🔄 Frecuencia de Actualización

### Antes:
- ⏱️ Cada 5 minutos (300,000 ms)

### Ahora:
- ⏱️ Cada 30 segundos (30,000 ms)

**Razón**: Detectar mensajes nuevos más rápidamente sin sobrecargar el servidor

---

## 💡 Casos de Uso

### Caso 1: Cliente esperando respuesta
1. Cliente crea un ticket
2. Asesor responde en el chat
3. **Badge aparece**: "🔔 1 Nuevos mensajes"
4. **Sonido**: Beep suave
5. Cliente hace clic en "Chat" para ver la respuesta

### Caso 2: Múltiples tickets activos
1. Cliente tiene 3 tickets en proceso
2. Asesor responde en 2 de ellos
3. **Badge aparece**: "🔔 2 Nuevos mensajes"
4. Cliente revisa ambos chats

### Caso 3: Ticket finalizado
1. Ticket está finalizado
2. No se cuentan mensajes de tickets finalizados
3. Badge solo muestra mensajes de tickets activos

---

## 🚀 Mejoras Futuras Sugeridas

1. **Notificaciones del navegador**: Usar Notification API para notificaciones del sistema
2. **Indicador por ticket**: Mostrar un punto rojo en cada ticket con mensajes nuevos
3. **Historial de notificaciones**: Panel con todas las notificaciones recibidas
4. **Personalización**: Permitir al usuario activar/desactivar sonidos
5. **Vibración móvil**: Usar Vibration API en dispositivos móviles

---

## 🐛 Solución de Problemas

### El badge no aparece:
- ✅ Verificar que hay tickets activos (no finalizados)
- ✅ Verificar que el asesor ha enviado mensajes
- ✅ Esperar 30 segundos para la próxima actualización

### El sonido no se reproduce:
- ✅ Verificar que el navegador permite audio
- ✅ Verificar que el volumen del sistema no está en mute
- ✅ Algunos navegadores bloquean audio automático

### El contador no se actualiza:
- ✅ Verificar conexión a internet
- ✅ Verificar que el servidor está corriendo
- ✅ Revisar la consola del navegador para errores

---

## 📝 Notas Técnicas

- El sistema usa `localStorage` para mantener la sesión del usuario
- Los contadores se reinician cuando se recarga la página
- El badge se oculta automáticamente al hacer clic
- Compatible con todos los navegadores modernos
- No requiere Socket.IO (usa polling cada 30s)

---

## ✅ Estado: COMPLETADO

Fecha de implementación: 27 de abril de 2026
Versión: 1.0

El cliente ahora recibe notificaciones claras y oportunas cuando el asesor le escribe.
