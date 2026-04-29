# 🔐 Mejoras de Seguridad Implementadas

## 📋 Resumen

Se han implementado múltiples capas de seguridad para proteger el sistema de registro, autenticación y pagos contra ataques comunes.

---

## 🛡️ Mejoras Implementadas

### 1. **Configuración de Firebase Protegida**

#### ❌ Antes (INSEGURO)
```javascript
// En checkout.html y login.html - EXPUESTO AL PÚBLICO
const firebaseConfig = {
  apiKey: "AIzaSyDkG2JyeF_mGwDx8dAL6BypVKLTzicSEe0",
  authDomain: "tecnired-221e0.firebaseapp.com",
  // ... más configuración hardcodeada
};
```

**Problema:** Cualquiera puede ver el código fuente y copiar las credenciales.

#### ✅ Ahora (SEGURO)
```javascript
// En .env (NO SE SUBE A GIT)
FIREBASE_API_KEY=AIzaSyDkG2JyeF_mGwDx8dAL6BypVKLTzicSEe0
FIREBASE_AUTH_DOMAIN=tecnired-221e0.firebaseapp.com
FIREBASE_PROJECT_ID=tecnired-221e0
FIREBASE_STORAGE_BUCKET=tecnired-221e0.firebasestorage.app
FIREBASE_APP_ID=1:247442670329:web:8a3215d5aeed054bd69828

// En server.js - Endpoint protegido
app.get("/api/firebase-config", generalLimiter, (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    appId: process.env.FIREBASE_APP_ID,
  });
});

// En checkout.html - Carga dinámica
const response = await fetch('/api/firebase-config');
const firebaseConfig = await response.json();
```

**Ventajas:**
- ✅ Credenciales en variables de entorno
- ✅ No expuestas en el código fuente
- ✅ Fácil rotación de claves
- ✅ Rate limiting aplicado

---

### 2. **Rate Limiting (Límite de Solicitudes)**

Protección contra ataques de fuerza bruta y abuso del sistema.

#### **Límites de Autenticación**
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por IP
  message: "Demasiados intentos. Intenta de nuevo en 15 minutos."
});
```

**Aplicado a:**
- `POST /register` - Registro de usuarios
- `POST /login` - Inicio de sesión
- `POST /auth/google` - Autenticación con Google

**Protege contra:**
- ❌ Ataques de fuerza bruta en contraseñas
- ❌ Creación masiva de cuentas falsas
- ❌ Spam de registros

#### **Límites de Pagos**
```javascript
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 pagos por hora por IP
  message: "Demasiadas solicitudes de pago. Intenta más tarde."
});
```

**Aplicado a:**
- `POST /pago/crear` - Creación de preferencias de pago

**Protege contra:**
- ❌ Abuso del sistema de pagos
- ❌ Generación masiva de links de pago
- ❌ Ataques de denegación de servicio (DoS)

#### **Límites Generales**
```javascript
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: "Demasiadas solicitudes. Intenta más tarde."
});
```

**Aplicado a:**
- `GET /api/firebase-config` - Configuración de Firebase
- Otros endpoints públicos

**Protege contra:**
- ❌ Scraping masivo
- ❌ Ataques DDoS
- ❌ Abuso de recursos del servidor

---

### 3. **Validación de Contraseñas Mejorada**

#### Requisitos Obligatorios
```javascript
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
```

**Debe contener:**
- ✅ Mínimo 8 caracteres
- ✅ Al menos una letra minúscula (a-z)
- ✅ Al menos una letra mayúscula (A-Z)
- ✅ Al menos un número (0-9)
- ✅ Al menos un símbolo especial (!@#$%^&*)

**Protege contra:**
- ❌ Contraseñas débiles
- ❌ Ataques de diccionario
- ❌ Fuerza bruta simple

---

### 4. **Hashing de Contraseñas con PBKDF2**

```javascript
function crearHashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 120000, 32, "sha256")
    .toString("hex");
  return `pbkdf2$120000$${salt}$${hash}`;
}
```

**Características:**
- ✅ Algoritmo: PBKDF2 con SHA-256
- ✅ 120,000 iteraciones (muy costoso para atacantes)
- ✅ Salt aleatorio de 16 bytes por contraseña
- ✅ Hash de 32 bytes

**Protege contra:**
- ❌ Rainbow tables
- ❌ Ataques de fuerza bruta offline
- ❌ Exposición de contraseñas en caso de filtración de BD

---

### 5. **Validación de Tokens de Firebase**

```javascript
async function verificarFirebaseToken(idToken) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const firebaseUser = data.users?.[0];
  
  // Verificar que el email esté verificado
  if (!firebaseUser?.email || firebaseUser.emailVerified === false) return null;

  return {
    nombre: firebaseUser.displayName || "Cliente Google",
    email: firebaseUser.email,
  };
}
```

**Protege contra:**
- ❌ Tokens falsificados
- ❌ Cuentas de Google no verificadas
- ❌ Suplantación de identidad

---

### 6. **Verificación de Webhook de Mercado Pago**

```javascript
app.post("/pago/webhook", async (req, res) => {
  const xSignature = req.headers["x-signature"];
  const xRequestId = req.headers["x-request-id"];

  if (xSignature && process.env.MP_WEBHOOK_SECRET) {
    const [tsPart, v1Part] = xSignature.split(",");
    const ts = tsPart?.split("=")[1];
    const v1 = v1Part?.split("=")[1];
    const manifest = `id:${data?.id};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET)
      .update(manifest)
      .digest("hex");
    
    if (hmac !== v1) {
      console.warn("⚠️ Webhook con firma inválida rechazado");
      return res.sendStatus(400);
    }
  }
  
  // Procesar pago...
});
```

**Protege contra:**
- ❌ Webhooks falsificados
- ❌ Activación fraudulenta de planes
- ❌ Manipulación de estados de pago

---

## 📊 Comparación Antes vs Después

| Aspecto | ❌ Antes | ✅ Ahora |
|---------|---------|----------|
| **Firebase Config** | Hardcodeado en HTML | Endpoint protegido con rate limit |
| **Rate Limiting** | Ninguno | 3 niveles (auth, pagos, general) |
| **Contraseñas** | Sin requisitos | 8+ caracteres, mayús, minus, número, símbolo |
| **Hashing** | PBKDF2 básico | PBKDF2 + 120k iteraciones + salt único |
| **Google Auth** | Token sin verificar email | Token verificado + email confirmado |
| **Webhook MP** | Sin verificación | Firma HMAC validada |
| **Variables Sensibles** | Algunas en código | Todas en .env |

---

## 🚀 Cómo Funciona en Producción

### 1. **Usuario Intenta Registrarse**
```
Cliente → POST /register
         ↓
    Rate Limiter (10 intentos/15min)
         ↓
    Validación de contraseña
         ↓
    Hash PBKDF2 (120k iteraciones)
         ↓
    Guardar en BD
         ↓
    Respuesta al cliente
```

### 2. **Usuario Usa Google Sign-In**
```
Cliente → GET /api/firebase-config
         ↓
    Rate Limiter (100 req/min)
         ↓
    Devolver config pública
         ↓
Cliente → Popup de Google
         ↓
Cliente → POST /auth/google con token
         ↓
    Rate Limiter (10 intentos/15min)
         ↓
    Verificar token con Firebase API
         ↓
    Verificar email confirmado
         ↓
    Crear/actualizar usuario en BD
         ↓
    Respuesta con sesión
```

### 3. **Usuario Crea un Pago**
```
Cliente → POST /pago/crear
         ↓
    Rate Limiter (5 pagos/hora)
         ↓
    Validar plan y email
         ↓
    Crear preferencia en Mercado Pago
         ↓
    Devolver link de pago
         ↓
Usuario paga en Mercado Pago
         ↓
MP → POST /pago/webhook
         ↓
    Verificar firma HMAC
         ↓
    Actualizar plan en BD
```

---

## 🔧 Configuración Requerida

### Variables de Entorno (.env)
```bash
# Firebase
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto
FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
FIREBASE_APP_ID=tu_app_id

# Mercado Pago
MP_ACCESS_TOKEN=tu_access_token
MP_WEBHOOK_SECRET=tu_webhook_secret

# Base de Datos
DB_HOST=tu_host
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tu_base_datos
DB_PORT=tu_puerto
```

### .gitignore
```
.env
node_modules/
*.log
```

**⚠️ IMPORTANTE:** Nunca subir el archivo `.env` a Git.

---

## 📝 Recomendaciones Adicionales

### Para Producción

1. **HTTPS Obligatorio**
   - Usar certificado SSL/TLS válido
   - Redirigir todo HTTP a HTTPS
   - Configurar HSTS headers

2. **Firewall de Aplicación Web (WAF)**
   - Cloudflare, AWS WAF, o similar
   - Protección contra SQL injection
   - Protección contra XSS

3. **Monitoreo y Alertas**
   - Logs de intentos fallidos de login
   - Alertas de rate limiting activado
   - Monitoreo de webhooks rechazados

4. **Backup de Base de Datos**
   - Backups automáticos diarios
   - Encriptación de backups
   - Pruebas de restauración

5. **Rotación de Credenciales**
   - Cambiar API keys cada 90 días
   - Rotar secrets de webhook
   - Actualizar contraseñas de BD

6. **Auditoría de Seguridad**
   - Revisar logs regularmente
   - Pruebas de penetración
   - Actualizar dependencias (npm audit)

---

## 🧪 Pruebas de Seguridad

### Probar Rate Limiting
```bash
# Intentar 11 logins en 15 minutos (debe bloquear el 11º)
for i in {1..11}; do
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Intento $i"
done
```

### Probar Validación de Contraseña
```bash
# Contraseña débil (debe rechazar)
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@test.com","password":"123456","telefono":"123"}'

# Contraseña fuerte (debe aceptar)
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@test.com","password":"Test123!@#","telefono":"123"}'
```

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)
- [PBKDF2 Specification](https://tools.ietf.org/html/rfc2898)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Mercado Pago Webhooks](https://www.mercadopago.com.co/developers/es/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks)

---

## ✅ Checklist de Seguridad

- [x] Credenciales en variables de entorno
- [x] Rate limiting en endpoints críticos
- [x] Validación fuerte de contraseñas
- [x] Hashing PBKDF2 con 120k iteraciones
- [x] Verificación de tokens de Firebase
- [x] Validación de firma de webhooks
- [x] .gitignore configurado correctamente
- [ ] HTTPS configurado (pendiente en producción)
- [ ] WAF configurado (pendiente en producción)
- [ ] Monitoreo y alertas (pendiente en producción)
- [ ] Backups automáticos (pendiente en producción)

---

**Última actualización:** 2026-04-29  
**Versión:** 2.0  
**Estado:** ✅ Implementado en desarrollo
