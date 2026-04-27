# 📋 Sistema de Planes TecniRed - Documentación Completa

## 🎯 Resumen del Sistema

Se ha implementado un sistema completo de planes con tres niveles: **Gratis**, **Estándar** y **Premium**, cada uno con funcionalidades y privilegios diferenciados.

---

## 💰 Planes Disponibles

### 🎁 Plan GRATIS (Prueba Gratuita - 7 días)
**Precio:** $0 COP

**Funcionalidades:**
- ✅ 1 ticket por mes
- ✅ Respuesta en 72 horas
- ✅ Chat básico (sin archivos adjuntos)
- ✅ Soporte por email
- ✅ Acceso a base de conocimientos
- ❌ Sin escalamiento a niveles superiores
- ❌ Sin soporte telefónico
- ❌ Sin videollamada
- ❌ Sin asesor dedicado
- ❌ Sin reportes personalizados

**Ideal para:** Usuarios que quieren probar el servicio antes de comprometerse.

---

### 📦 Plan ESTÁNDAR
**Precio de Prueba:** $2,000 COP (para testing)  
**Precio Real:** $60,000 COP/mes

**Funcionalidades:**
- ✅ 5 tickets por mes
- ✅ Respuesta en 24 horas
- ✅ Chat prioritario con archivos adjuntos
- ✅ Escalamiento N1-N2
- ✅ Historial de tickets completo
- ✅ Notificaciones por email
- ✅ Soporte telefónico en horario laboral (8am-6pm)
- ❌ Sin videollamada
- ❌ Sin asesor dedicado
- ❌ Sin reportes personalizados

**Ideal para:** Pequeñas empresas o usuarios frecuentes que necesitan soporte confiable.

---

### 💎 Plan PREMIUM
**Precio:** $100,000 COP/mes

**Funcionalidades:**
- ✅ Tickets ilimitados
- ✅ Respuesta en 4 horas (24/7)
- ✅ Asesor dedicado personal
- ✅ Escalamiento completo N1-N2-N3
- ✅ Chat con videollamada
- ✅ Soporte telefónico 24/7
- ✅ Reportes mensuales personalizados
- ✅ Acceso prioritario a nuevas funcionalidades
- ✅ Monitoreo preventivo mensual
- ✅ Historial completo sin límites

**Ideal para:** Empresas medianas/grandes que requieren soporte crítico y atención personalizada.

---

## 🔧 Implementación Técnica

### Archivos Modificados/Creados:

1. **backend/server.js**
   - Constante `PLANES` con configuración detallada
   - Función `verificarLimitesPlan()` para validar restricciones
   - Endpoint `/planes` - Lista todos los planes disponibles
   - Endpoint `/usuario/plan/:email` - Obtiene plan y límites del usuario
   - Endpoint `/pago/crear` - Crea preferencia de pago en MercadoPago
   - Endpoint `/pago/webhook` - Recibe notificaciones de pago
   - Middleware en `/tickets` para verificar límites antes de crear

2. **backend/public/planes.html** (NUEVO)
   - Página de comparación de planes
   - Diseño responsive con tarjetas
   - Integración con MercadoPago
   - Muestra plan actual del usuario
   - Botones de compra dinámicos

3. **backend/public/user_cliente.html** (MODIFICADO)
   - Banner dinámico según plan
   - Barra de progreso de límites
   - Sección de funcionalidades premium
   - Bloqueo de creación de tickets al alcanzar límite
   - Estadísticas de uso

4. **backend/public/pago_exito.html** (NUEVO)
   - Página de confirmación de pago exitoso

5. **backend/public/pago_fallo.html** (NUEVO)
   - Página de error en el pago

6. **backend/public/pago_pendiente.html** (NUEVO)
   - Página de pago pendiente de confirmación

---

## 🔐 Lógica de Restricciones

### Límite de Tickets por Mes:
```javascript
// Gratis: 1 ticket/mes
// Estándar: 5 tickets/mes
// Premium: Ilimitados

// Se cuenta desde el día 1 del mes actual
// Se bloquea la creación si se alcanza el límite
// Se muestra barra de progreso visual
```

### Verificación en Tiempo Real:
- Al cargar el panel del cliente
- Antes de crear un nuevo ticket
- Al actualizar la lista de tickets

---

## 💳 Flujo de Pago (MercadoPago)

1. Usuario hace clic en "Comprar Ahora"
2. Frontend llama a `/pago/crear` con plan y email
3. Backend crea preferencia en MercadoPago
4. Usuario es redirigido a MercadoPago (sandbox en desarrollo)
5. Usuario completa el pago
6. MercadoPago notifica al webhook `/pago/webhook`
7. Backend actualiza el plan del usuario en la BD
8. Usuario es redirigido a página de éxito/fallo

---

## 🗄️ Base de Datos

### Tabla `usuarios`:
```sql
ALTER TABLE usuarios ADD COLUMN plan VARCHAR(20) DEFAULT 'gratis';
```

### Tabla `pagos`:
```sql
CREATE TABLE pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  mp_payment_id VARCHAR(100) UNIQUE,
  estado VARCHAR(50) DEFAULT 'pendiente',
  fecha DATETIME DEFAULT NOW()
);
```

---

## 🧪 Testing

### Para Probar el Sistema:

1. **Configurar MercadoPago:**
   ```env
   MP_ACCESS_TOKEN=tu_access_token_de_prueba
   MP_WEBHOOK_SECRET=tu_webhook_secret
   APP_URL=http://localhost:3000
   ```

2. **Usar Precio de Prueba:**
   - Plan Estándar está configurado en $2,000 COP
   - Cambiar a $60,000 cuando esté listo para producción

3. **Probar Flujos:**
   - Crear cuenta nueva (plan gratis por defecto)
   - Intentar crear más de 1 ticket (debe bloquearse)
   - Comprar plan estándar con $2,000
   - Verificar que se desbloquean 5 tickets
   - Probar funcionalidades premium

---

## 🎨 Diseño Visual

### Colores por Plan:
- **Gratis:** Gris (#94a3b8)
- **Estándar:** Azul (#38bdf8)
- **Premium:** Morado (#a78bfa)

### Elementos Visuales:
- Badges de plan en el header
- Banner dinámico con gradientes
- Barra de progreso de límites
- Tarjetas de funcionalidades premium
- Iconos distintivos por plan

---

## 📊 Recomendaciones de Marketing

### Por qué estos precios funcionan:

1. **Plan Gratis ($0):**
   - Elimina la barrera de entrada
   - Permite probar el servicio
   - Genera confianza

2. **Plan Estándar ($60,000):**
   - Precio accesible para pequeñas empresas
   - 5 tickets/mes cubre necesidades básicas
   - Soporte en horario laboral es suficiente

3. **Plan Premium ($100,000):**
   - Valor percibido alto (asesor dedicado)
   - Tickets ilimitados justifican el precio
   - Soporte 24/7 para empresas críticas

### Estrategia de Conversión:

1. **Gratis → Estándar:**
   - Mostrar límite alcanzado
   - Destacar respuesta más rápida (72h → 24h)
   - Precio bajo de entrada ($2,000 prueba)

2. **Estándar → Premium:**
   - Resaltar asesor dedicado
   - Enfatizar soporte 24/7
   - Mostrar valor de tickets ilimitados

---

## 🚀 Próximos Pasos

### Funcionalidades Adicionales Sugeridas:

1. **Para Plan Premium:**
   - Videollamadas integradas (Zoom/Meet)
   - Dashboard de reportes personalizados
   - API de integración
   - Prioridad en cola de soporte

2. **Para Todos los Planes:**
   - Historial de pagos
   - Facturas descargables
   - Renovación automática
   - Descuentos por pago anual

3. **Mejoras Técnicas:**
   - Notificaciones por email al cambiar plan
   - Sistema de cupones/descuentos
   - Programa de referidos
   - Métricas de uso por plan

---

## 📞 Soporte

Para cambiar el precio de prueba a producción:

```javascript
// En backend/server.js, línea ~280
const PLANES = {
  estandar: {
    precio: 60000, // Cambiar de 2000 a 60000
    // ...
  }
}
```

---

## ✅ Checklist de Implementación

- [x] Sistema de planes con 3 niveles
- [x] Restricciones por plan
- [x] Integración con MercadoPago
- [x] Páginas de pago (éxito/fallo/pendiente)
- [x] Interfaz diferenciada por plan
- [x] Barra de progreso de límites
- [x] Webhook de confirmación de pago
- [x] Tabla de pagos en BD
- [x] Documentación completa

---

**Desarrollado para TecniRed** 🚀  
**Fecha:** Abril 2026  
**Versión:** 1.0
