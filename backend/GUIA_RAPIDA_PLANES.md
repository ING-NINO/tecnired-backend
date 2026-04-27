# 🚀 Guía Rápida - Sistema de Planes TecniRed

## 📌 ¿Qué se implementó?

Un sistema completo de suscripciones con **3 planes diferenciados** que controlan el acceso a funcionalidades según el nivel de pago.

---

## 💡 Comparación Visual de Planes

| Característica | 🎁 GRATIS | 📦 ESTÁNDAR | 💎 PREMIUM |
|----------------|-----------|-------------|------------|
| **Precio** | $0 | $2,000* | $100,000 |
| **Tickets/mes** | 1 | 5 | ∞ Ilimitados |
| **Tiempo respuesta** | 72 horas | 24 horas | 4 horas |
| **Archivos adjuntos** | ❌ | ✅ | ✅ |
| **Escalamiento** | ❌ | N1-N2 | N1-N2-N3 |
| **Soporte telefónico** | ❌ | Horario laboral | 24/7 |
| **Videollamada** | ❌ | ❌ | ✅ |
| **Asesor dedicado** | ❌ | ❌ | ✅ |
| **Reportes** | ❌ | ❌ | ✅ Mensuales |

*Precio de prueba. Cambiar a $60,000 para producción.

---

## 🎯 Flujo del Usuario

### 1️⃣ Usuario Nuevo (Plan Gratis)
```
Registro → Plan GRATIS automático → 1 ticket disponible
```

### 2️⃣ Usuario Alcanza Límite
```
Intenta crear ticket #2 → ❌ BLOQUEADO → Ver botón "Actualizar Plan"
```

### 3️⃣ Usuario Compra Plan
```
Clic en "Actualizar" → Página de Planes → Selecciona Estándar/Premium
→ MercadoPago → Pago exitoso → Plan activado automáticamente
```

### 4️⃣ Usuario con Plan Activo
```
Panel muestra: Badge del plan + Funcionalidades desbloqueadas + Límites actualizados
```

---

## 🔧 Archivos Clave

### Backend:
- `backend/server.js` - Lógica de planes, límites y pagos
- `backend/db.js` - Conexión a base de datos

### Frontend:
- `backend/public/planes.html` - Página de comparación y compra
- `backend/public/user_cliente.html` - Panel con restricciones por plan
- `backend/public/pago_exito.html` - Confirmación de pago
- `backend/public/pago_fallo.html` - Error en pago
- `backend/public/pago_pendiente.html` - Pago en proceso

---

## 🧪 Cómo Probar

### Paso 1: Configurar Variables de Entorno
```env
# En backend/.env
MP_ACCESS_TOKEN=tu_token_de_mercadopago_sandbox
MP_WEBHOOK_SECRET=tu_webhook_secret
APP_URL=http://localhost:3000
```

### Paso 2: Iniciar Servidor
```bash
cd backend
npm start
```

### Paso 3: Probar Flujos

#### A) Plan Gratis (por defecto)
1. Crear cuenta nueva
2. Ir al panel de cliente
3. Crear 1 ticket ✅
4. Intentar crear ticket #2 ❌ (bloqueado)
5. Ver mensaje: "Alcanzaste el límite"

#### B) Comprar Plan Estándar
1. Clic en "Actualizar a Estándar"
2. Ir a `/planes.html`
3. Clic en "Comprar Ahora" (Plan Estándar)
4. Completar pago en MercadoPago Sandbox
5. Redirigido a `/pago_exito.html`
6. Volver al panel → Badge muestra "Estándar"
7. Crear hasta 5 tickets ✅

#### C) Verificar Límites
1. Con plan Estándar activo
2. Crear 5 tickets
3. Intentar crear ticket #6 ❌ (bloqueado)
4. Ver barra de progreso: 5/5 (roja)

---

## 🎨 Interfaz Visual

### Panel de Cliente Muestra:

```
┌─────────────────────────────────────────────┐
│ 🏠 TECNIRED    [📦 Estándar] 👤 Juan  [Salir]│
├─────────────────────────────────────────────┤
│                                             │
│  ⚡ Plan Estándar                           │
│  Hasta 5 tickets simultáneos               │
│  [Subir a Premium] →                       │
│                                             │
├─────────────────────────────────────────────┤
│  Tickets activos: ████████░░ 4 / 5         │
├─────────────────────────────────────────────┤
│  [Crear nuevo ticket]                      │
│  Categoría: [Hardware ▼]                   │
│  Descripción: [____________]               │
│  [✉ Enviar ticket]                         │
├─────────────────────────────────────────────┤
│  Mis Tickets:                              │
│  #123 | Hardware | Nuevo | [Chat]         │
│  #122 | Software | Proceso | [Chat]       │
└─────────────────────────────────────────────┘
```

---

## 💳 Integración MercadoPago

### Endpoints:

1. **POST `/pago/crear`**
   - Crea preferencia de pago
   - Retorna `init_point` para redirección

2. **POST `/pago/webhook`**
   - Recibe notificación de MercadoPago
   - Actualiza plan del usuario automáticamente

3. **GET `/pago/exito`**
   - Página de confirmación

---

## 🔐 Seguridad Implementada

✅ Verificación de límites en backend (no solo frontend)  
✅ Validación de firma de webhook de MercadoPago  
✅ Prevención de duplicados con `mp_payment_id UNIQUE`  
✅ Transacciones atómicas en base de datos  

---

## 📊 Base de Datos

### Tabla `usuarios`:
```sql
-- Columna agregada:
plan VARCHAR(20) DEFAULT 'gratis'
```

### Tabla `pagos` (nueva):
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

## 🚨 Cambiar a Producción

### 1. Actualizar Precio de Estándar:
```javascript
// En backend/server.js, línea ~280
estandar: {
  precio: 60000, // ← Cambiar de 2000 a 60000
  // ...
}
```

### 2. Configurar MercadoPago Producción:
```env
MP_ACCESS_TOKEN=tu_token_de_produccion
APP_URL=https://tu-dominio.com
```

### 3. Verificar Webhook:
- Configurar URL pública en MercadoPago
- Probar con pago real pequeño

---

## 🎁 Estrategia de Conversión

### Gratis → Estándar:
- **Trigger:** Usuario alcanza 1 ticket
- **Mensaje:** "Actualiza para gestionar hasta 5 tickets"
- **Precio:** $2,000 (prueba) / $60,000 (real)
- **Beneficio clave:** Respuesta en 24h vs 72h

### Estándar → Premium:
- **Trigger:** Usuario alcanza 5 tickets
- **Mensaje:** "Obtén tickets ilimitados y asesor dedicado"
- **Precio:** $100,000
- **Beneficio clave:** Asesor dedicado + Soporte 24/7

---

## ✅ Checklist de Funcionalidades

- [x] 3 planes con límites diferenciados
- [x] Restricción de creación de tickets
- [x] Barra de progreso visual
- [x] Integración MercadoPago
- [x] Webhook de confirmación
- [x] Páginas de resultado de pago
- [x] Badge de plan en header
- [x] Banner dinámico por plan
- [x] Funcionalidades premium destacadas
- [x] Tabla de pagos en BD
- [x] Documentación completa

---

## 🆘 Soporte

### Problemas Comunes:

**1. "No se crea la tabla pagos"**
- Verificar permisos de BD
- Ejecutar manualmente el SQL

**2. "Webhook no funciona"**
- Verificar `MP_WEBHOOK_SECRET` en .env
- Usar ngrok para testing local

**3. "Plan no se actualiza después del pago"**
- Revisar logs del webhook
- Verificar que `mp_payment_id` sea único

---

## 📞 Contacto

**Desarrollado para:** TecniRed  
**Fecha:** Abril 2026  
**Versión:** 1.0  

---

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional. Solo necesitas:
1. Configurar MercadoPago
2. Ajustar precios si es necesario
3. ¡Empezar a vender!

**¡Éxito con tu plataforma! 🚀**
