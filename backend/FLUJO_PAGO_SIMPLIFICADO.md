# Flujo de Pago Simplificado - Estilo Hostinger

## 📋 Descripción General

Se ha implementado un flujo de pago simplificado que permite a los usuarios comprar un plan sin necesidad de registrarse previamente. El proceso es directo y sin rodeos, similar al checkout de Hostinger.

## 🔄 Flujo Completo

### 1. Usuario NO Logueado (Nuevo Cliente)

```
Página Principal (index.html)
    ↓
Ver Planes (planes.html)
    ↓
Seleccionar Plan → Click en "Comprar Ahora"
    ↓
Checkout (checkout.html?plan=estandar o premium)
    ↓
Completar Formulario:
  - Nombre completo
  - Email
  - Teléfono
  - Contraseña
  - Dirección de facturación
    ↓
Click en "Procesar Pago Seguro"
    ↓
Sistema automáticamente:
  1. Registra al usuario (POST /register)
  2. Hace login automático (POST /login)
  3. Crea preferencia de pago (POST /pago/crear)
  4. Redirige a Mercado Pago
    ↓
Usuario completa pago en Mercado Pago
    ↓
Mercado Pago redirige según resultado:
  - Éxito → /pago_exito.html
  - Fallo → /pago_fallo.html
  - Pendiente → /pago_pendiente.html
    ↓
Webhook actualiza plan del usuario en BD
    ↓
Usuario puede acceder a /user_cliente.html con su plan activo
```

### 2. Usuario YA Logueado

```
Panel Cliente (user_cliente.html)
    ↓
Ver Planes (planes.html)
    ↓
Seleccionar Plan → Click en "Comprar Ahora"
    ↓
Confirmación
    ↓
Sistema automáticamente:
  1. Crea preferencia de pago (POST /pago/crear)
  2. Redirige a Mercado Pago
    ↓
[Resto del flujo igual que arriba]
```

## 📁 Archivos Modificados

### 1. `backend/public/checkout.html` (NUEVO)
- Página de checkout con formulario completo
- Diseño moderno con glassmorphism
- Resumen del pedido con detalles del plan
- Integración con Mercado Pago
- Registro + Login + Pago en un solo flujo

**Características:**
- Validación de formularios HTML5
- Loading spinner durante procesamiento
- Manejo de errores amigable
- Responsive design
- Precios sin IVA (simplificado)

### 2. `backend/public/planes.html` (MODIFICADO)
- Ahora permite acceso sin login
- Detecta si el usuario está logueado
- Si NO está logueado → Redirige a checkout
- Si SÍ está logueado → Flujo normal de pago
- Botón "Volver" dinámico (Panel o Inicio)

**Cambios clave:**
```javascript
function comprarPlan(planId) {
  // Si no está logueado, ir a checkout
  if (!userEmail) {
    window.location.href = `/checkout.html?plan=${planId}`;
    return;
  }
  
  // Si está logueado, flujo normal
  // ...
}
```

### 3. `backend/server.js` (SIN CAMBIOS)
Ya tiene todos los endpoints necesarios:
- `POST /register` - Registro de usuarios
- `POST /login` - Autenticación
- `POST /pago/crear` - Crear preferencia de Mercado Pago
- `POST /pago/webhook` - Recibir notificaciones de pago
- `GET /pago/exito` - Página de éxito
- `GET /pago/fallo` - Página de fallo
- `GET /pago/pendiente` - Página de pendiente

## 💰 Planes Disponibles

### Plan Estándar
- **Precio:** $29,000 COP/mes
- **Características:**
  - 5 tickets por mes
  - Respuesta en 24h
  - Escalamiento N1-N2
  - Soporte prioritario
  - Envío de archivos

### Plan Premium
- **Precio:** $99,000 COP/mes
- **Características:**
  - Tickets ilimitados
  - Respuesta en 4h
  - Asesor dedicado
  - Soporte 24/7
  - Prioridad máxima
  - Videollamadas
  - Reportes personalizados

### Plan Gratis
- **Precio:** $0 (7 días de prueba)
- **Características:**
  - 1 ticket por mes
  - Respuesta en 72h
  - Chat básico
  - Sin adjuntos

## 🔐 Seguridad

1. **Validación de Contraseñas:**
   - Mínimo 8 caracteres
   - Al menos una mayúscula
   - Al menos una minúscula
   - Al menos un número
   - Al menos un símbolo

2. **Hashing de Contraseñas:**
   - Algoritmo: PBKDF2 con SHA-256
   - 120,000 iteraciones
   - Salt aleatorio de 16 bytes

3. **Pago Seguro:**
   - Integración oficial con Mercado Pago
   - Certificado SSL
   - Webhook con verificación de firma

## 🧪 Pruebas

### Probar Flujo Completo (Usuario Nuevo)

1. Abrir navegador en modo incógnito
2. Ir a `http://localhost:3000`
3. Click en "Ver Planes" o ir a `/planes.html`
4. Seleccionar "Plan Estándar" o "Plan Premium"
5. Click en "Comprar Ahora"
6. Completar formulario de checkout
7. Click en "Procesar Pago Seguro"
8. Verificar redirección a Mercado Pago (sandbox)
9. Completar pago de prueba
10. Verificar redirección a página de éxito
11. Verificar que el usuario puede acceder a `/user_cliente.html`

### Probar Flujo (Usuario Existente)

1. Iniciar sesión en `/login.html`
2. Ir a `/planes.html`
3. Seleccionar plan
4. Click en "Comprar Ahora"
5. Confirmar
6. Verificar redirección a Mercado Pago
7. Completar pago
8. Verificar actualización de plan

## 🐛 Solución de Problemas

### Error: "El email ya está registrado"
- **Causa:** Usuario intentó registrarse con email existente pero contraseña diferente
- **Solución:** Usar el botón "Iniciar Sesión" en lugar de checkout

### Error: "Plan no válido"
- **Causa:** URL sin parámetro `plan` o plan incorrecto
- **Solución:** Verificar URL: `/checkout.html?plan=estandar` o `?plan=premium`

### Error: "No se pudo crear el pago"
- **Causa:** Problema con Mercado Pago (credenciales, conexión)
- **Solución:** Verificar variables de entorno `MP_ACCESS_TOKEN` en `.env`

### Pago aprobado pero plan no actualizado
- **Causa:** Webhook no recibido o error en procesamiento
- **Solución:** Verificar logs del servidor y tabla `pagos` en BD

## 📊 Base de Datos

### Tabla `usuarios`
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- nombre (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR) -- Hash PBKDF2
- telefono (VARCHAR)
- rol (ENUM: 'cliente', 'asesor', 'admin')
- plan (VARCHAR: 'gratis', 'estandar', 'premium')
```

### Tabla `pagos`
```sql
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- email (VARCHAR)
- plan (VARCHAR)
- monto (DECIMAL)
- mp_payment_id (VARCHAR, UNIQUE)
- estado (VARCHAR: 'pendiente', 'aprobado', 'rechazado')
- fecha (DATETIME)
```

## 🚀 Próximos Pasos

1. ✅ Implementar checkout simplificado
2. ✅ Integrar con Mercado Pago
3. ✅ Actualizar planes.html para usuarios no logueados
4. ⏳ Probar en producción con credenciales reales
5. ⏳ Configurar webhook público (ngrok o dominio)
6. ⏳ Agregar emails de confirmación de pago
7. ⏳ Implementar renovación automática de planes

## 📝 Notas Importantes

- **Modo Sandbox:** Actualmente usa `sandbox_init_point` para pruebas
- **Precios de Prueba:** Plan Estándar en $2,000 para testing (cambiar a $60,000 en producción)
- **IVA:** Actualmente deshabilitado para simplificar (mostrar $0)
- **Webhook:** Debe ser URL pública para que Mercado Pago pueda notificar
- **Plan Gratis:** No requiere pago, se asigna automáticamente al registrarse

## 🔗 Enlaces Útiles

- [Documentación Mercado Pago](https://www.mercadopago.com.co/developers/es/docs)
- [Testing en Sandbox](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/test-cards)
- [Webhooks](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks)
