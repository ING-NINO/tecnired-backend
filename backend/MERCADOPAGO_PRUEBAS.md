# 💳 Configuración de Mercado Pago - Modo Prueba

## 📋 Paso 1: Obtener Credenciales de Prueba

1. Ve a: **https://www.mercadopago.com.co/developers/panel**
2. Inicia sesión con tu cuenta de Mercado Pago
3. En el menú lateral, ve a **"Tus integraciones"**
4. Selecciona tu aplicación o crea una nueva
5. Ve a la pestaña **"Credenciales de prueba"**

Verás algo como:

```
Public Key (Prueba): TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Access Token (Prueba): TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 📝 Paso 2: Actualizar .env con Credenciales de Prueba

Reemplaza en tu archivo `.env`:

```bash
# ===== MERCADOPAGO (MODO PRUEBA) =====
MP_PUBLIC_KEY=TEST-tu-public-key-de-prueba
MP_ACCESS_TOKEN=TEST-tu-access-token-de-prueba
MP_WEBHOOK_SECRET=tu_webhook_secret
APP_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** Las credenciales de prueba empiezan con `TEST-`

## 🧪 Paso 3: Crear Usuarios de Prueba

Para probar pagos, necesitas usuarios de prueba:

1. En el panel de desarrolladores, ve a **"Usuarios de prueba"**
2. Haz clic en **"Crear usuario de prueba"**
3. Crea dos usuarios:
   - **Vendedor** (tu aplicación)
   - **Comprador** (para hacer las pruebas)

### Datos del Usuario Comprador de Prueba

Guarda estos datos, los necesitarás para probar:

```
Email: test_user_XXXXXXXX@testuser.com
Contraseña: qatest####
```

## 💳 Tarjetas de Prueba

Usa estas tarjetas para simular diferentes escenarios:

### ✅ Pago Aprobado
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: APRO
```

### ❌ Pago Rechazado
```
Número: 5031 4332 1540 6351
CVV: 123
Fecha: 11/25
Nombre: OCHO
```

### ⏳ Pago Pendiente
```
Número: 5031 7557 3453 0604
CVV: 123
Fecha: 11/25
Nombre: CONT
```

### 🔄 Más Tarjetas de Prueba

| Tarjeta | Número | Estado |
|---------|--------|--------|
| Mastercard | 5031 7557 3453 0604 | Aprobado |
| Visa | 4509 9535 6623 3704 | Aprobado |
| American Express | 3711 803032 57522 | Aprobado |
| Mastercard | 5031 4332 1540 6351 | Rechazado |

**Nombre del titular:** Usa estos códigos para simular estados:
- **APRO** → Pago aprobado
- **CONT** → Pago pendiente
- **OCHO** → Pago rechazado (fondos insuficientes)
- **CALL** → Pago rechazado (llamar para autorizar)

## 🔧 Paso 4: Configurar Precios de Prueba

En `server.js`, los precios ya están configurados para prueba:

```javascript
const PLANES = {
  estandar: {
    precio: 2000, // $2.000 COP para pruebas
    // ...
  },
  premium: {
    precio: 100000, // $100.000 COP
    // ...
  }
};
```

## 🧪 Paso 5: Probar el Flujo Completo

### Prueba 1: Pago Exitoso

1. Ve a: `http://localhost:3000/planes.html`
2. Selecciona un plan (Estándar o Premium)
3. Click en "Comprar Ahora"
4. Completa el formulario o usa Google Sign-In
5. Serás redirigido a Mercado Pago (sandbox)
6. Usa la tarjeta de prueba con nombre **APRO**
7. Completa el pago
8. Deberías ser redirigido a `/pago_exito.html`
9. Tu plan debería actualizarse en la base de datos

### Prueba 2: Pago Rechazado

1. Repite los pasos 1-5
2. Usa la tarjeta con nombre **OCHO**
3. El pago será rechazado
4. Deberías ser redirigido a `/pago_fallo.html`
5. Tu plan NO debería cambiar

### Prueba 3: Pago Pendiente

1. Repite los pasos 1-5
2. Usa la tarjeta con nombre **CONT**
3. El pago quedará pendiente
4. Deberías ser redirigido a `/pago_pendiente.html`
5. Tu plan NO debería cambiar hasta que se apruebe

## 🔍 Verificar Pagos en el Panel

1. Ve a: **https://www.mercadopago.com.co/developers/panel**
2. En el menú lateral, ve a **"Pagos de prueba"**
3. Verás todos los pagos de prueba que has realizado
4. Puedes ver el estado, monto, y detalles de cada pago

## 📊 Verificar en la Base de Datos

Después de un pago exitoso, verifica en tu base de datos:

```sql
-- Ver el plan del usuario
SELECT email, plan FROM usuarios WHERE email = 'tu-email@test.com';

-- Ver los pagos registrados
SELECT * FROM pagos ORDER BY fecha DESC LIMIT 5;
```

## 🐛 Debugging

### Ver Logs del Servidor

El servidor mostrará logs cuando reciba webhooks:

```
✅ Plan premium activado para test@test.com
```

### Ver Logs en Mercado Pago

En el panel de desarrolladores:
1. Ve a **"Webhooks"**
2. Verás todos los webhooks enviados
3. Puedes ver el payload y la respuesta

## ⚠️ Problemas Comunes

### Error: "Invalid credentials"
- **Causa:** Estás usando credenciales de producción en lugar de prueba
- **Solución:** Verifica que las credenciales empiecen con `TEST-`

### Error: "Webhook not received"
- **Causa:** El webhook URL no es accesible desde internet
- **Solución:** En desarrollo, usa ngrok o similar para exponer localhost

### Error: "Payment not updating plan"
- **Causa:** El webhook no está procesando correctamente
- **Solución:** Verifica los logs del servidor y la tabla `pagos`

## 🚀 Pasar a Producción

Cuando estés listo para producción:

1. **Obtén credenciales de producción:**
   - Ve al panel de desarrolladores
   - Pestaña **"Credenciales de producción"**
   - Copia el Access Token (sin TEST-)

2. **Actualiza .env:**
   ```bash
   MP_ACCESS_TOKEN=APP_USR-tu-access-token-real
   APP_URL=https://tu-dominio.com
   ```

3. **Actualiza precios:**
   ```javascript
   estandar: {
     precio: 60000, // Precio real
   }
   ```

4. **Configura webhook público:**
   - Usa tu dominio real
   - Configura en el panel de MP

## 📝 Checklist de Pruebas

- [ ] Credenciales de prueba configuradas
- [ ] Usuario de prueba creado
- [ ] Pago aprobado funciona
- [ ] Pago rechazado funciona
- [ ] Pago pendiente funciona
- [ ] Plan se actualiza correctamente
- [ ] Webhook recibe notificaciones
- [ ] Páginas de éxito/fallo funcionan
- [ ] Base de datos se actualiza

## 🎯 Próximos Pasos

1. Prueba todos los escenarios
2. Verifica que los webhooks funcionen
3. Confirma que los planes se actualicen
4. Cuando todo funcione, pasa a producción
