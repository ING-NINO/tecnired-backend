# 🔧 Actualizar Plan Manualmente

## Problema
El webhook no funciona en localhost porque Mercado Pago no puede enviar notificaciones a `http://localhost:3000`.

## Solución: Actualizar Plan Manualmente en Railway

### Paso 1: Conectar a Railway

1. Ve a: https://railway.app
2. Selecciona tu proyecto
3. Click en la base de datos MySQL
4. Click en la pestaña **"Data"** o **"Query"**

### Paso 2: Ejecutar esta Consulta SQL

```sql
-- Ver el plan actual
SELECT email, plan FROM usuarios WHERE email = 'cs7256081@gmail.com';

-- Actualizar a Plan Estándar
UPDATE usuarios SET plan = 'estandar' WHERE email = 'cs7256081@gmail.com';

-- Verificar el cambio
SELECT email, plan FROM usuarios WHERE email = 'cs7256081@gmail.com';
```

### Paso 3: Verificar en la Aplicación

1. Cierra sesión en tu aplicación
2. Vuelve a iniciar sesión con `cs7256081@gmail.com`
3. Deberías ver "Plan Estándar" en tu perfil
4. Ahora puedes crear hasta 5 tickets por mes

---

## ✅ Resultado Esperado

Después de ejecutar el UPDATE, deberías ver:

```
email: cs7256081@gmail.com
plan: estandar
```

---

## 🚀 En Producción (Render)

Una vez que despleguemos en Render, el webhook funcionará automáticamente porque:

- ✅ Mercado Pago SÍ puede enviar notificaciones a `https://tecnired-backend.onrender.com/pago/webhook`
- ✅ El plan se actualizará automáticamente después de cada pago
- ✅ No necesitarás actualizar manualmente

---

## 📝 Comandos Útiles

```sql
-- Ver todos los usuarios y sus planes
SELECT id, nombre, email, plan FROM usuarios ORDER BY id DESC;

-- Cambiar plan a Premium
UPDATE usuarios SET plan = 'premium' WHERE email = 'cs7256081@gmail.com';

-- Cambiar plan a Gratis
UPDATE usuarios SET plan = 'gratis' WHERE email = 'cs7256081@gmail.com';

-- Ver historial de pagos
SELECT * FROM pagos ORDER BY fecha DESC LIMIT 10;
```
