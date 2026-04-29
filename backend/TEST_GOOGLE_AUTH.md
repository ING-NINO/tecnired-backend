# 🧪 Prueba de Google Authentication

## ⚠️ Problema Reportado
"No me está sirviendo el de Google, me dice revisa Firebase Auth"

## 🔍 Diagnóstico

### Posibles Causas

1. **Servidor no está corriendo**
   - El endpoint `/api/firebase-config` no responde
   - Solución: Iniciar el servidor

2. **Variables de entorno no cargadas**
   - Firebase config no se encuentra
   - Solución: Verificar que `.env` tenga las variables

3. **Firebase no inicializado a tiempo**
   - El botón se hace clic antes de que Firebase esté listo
   - Solución: Ya implementado - botón deshabilitado hasta que cargue

## ✅ Pasos para Probar

### 1. Iniciar el Servidor
```bash
cd backend
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en puerto 3000
✅ Tabla chat_interno lista
✅ Tabla feedback lista
✅ Columna plan ya existe
```

### 2. Verificar Endpoint de Firebase Config
Abre en el navegador o usa curl:
```
http://localhost:3000/api/firebase-config
```

Deberías ver algo como:
```json
{
  "apiKey": "AIzaSyDkG2JyeF_mGwDx8dAL6BypVKLTzicSEe0",
  "authDomain": "tecnired-221e0.firebaseapp.com",
  "projectId": "tecnired-221e0",
  "storageBucket": "tecnired-221e0.firebasestorage.app",
  "appId": "1:247442670329:web:8a3215d5aeed054bd69828"
}
```

### 3. Probar Login con Google

#### En Login Page (`/login.html`)
1. Abre `http://localhost:3000/login.html`
2. Haz clic en "Continuar con Google"
3. Selecciona tu cuenta de Google
4. Deberías ser redirigido al panel correspondiente

#### En Checkout Page (`/checkout.html`)
1. Abre `http://localhost:3000/checkout.html?plan=estandar`
2. Espera a que el botón diga "Continuar con Google (más rápido)"
3. Haz clic en el botón
4. Selecciona tu cuenta de Google
5. Deberías ser redirigido a Mercado Pago

### 4. Verificar Consola del Navegador

Abre las DevTools (F12) y ve a la pestaña Console.

**Si ves errores:**

#### Error: "Cannot GET /api/firebase-config"
- **Causa**: Servidor no está corriendo
- **Solución**: Inicia el servidor con `npm start`

#### Error: "Failed to fetch"
- **Causa**: CORS o servidor caído
- **Solución**: Verifica que el servidor esté en puerto 3000

#### Error: "auth/popup-blocked"
- **Causa**: El navegador bloqueó el popup de Google
- **Solución**: Permite popups para localhost

#### Error: "Firebase: Error (auth/configuration-not-found)"
- **Causa**: Variables de entorno no cargadas
- **Solución**: Verifica `.env` y reinicia el servidor

## 🐛 Debugging Paso a Paso

### Paso 1: Verificar Variables de Entorno
```bash
# En backend/
cat .env | grep FIREBASE
```

Deberías ver:
```
FIREBASE_API_KEY=AIzaSyDkG2JyeF_mGwDx8dAL6BypVKLTzicSEe0
FIREBASE_AUTH_DOMAIN=tecnired-221e0.firebaseapp.com
FIREBASE_PROJECT_ID=tecnired-221e0
FIREBASE_STORAGE_BUCKET=tecnired-221e0.firebasestorage.app
FIREBASE_APP_ID=1:247442670329:web:8a3215d5aeed054bd69828
```

### Paso 2: Verificar que el Servidor Carga las Variables
Agrega esto temporalmente en `server.js` después de `require("dotenv").config()`:
```javascript
console.log("🔥 Firebase API Key:", process.env.FIREBASE_API_KEY ? "✅ Cargada" : "❌ NO ENCONTRADA");
```

### Paso 3: Probar el Endpoint Manualmente
```bash
curl http://localhost:3000/api/firebase-config
```

### Paso 4: Verificar Consola del Navegador
1. Abre DevTools (F12)
2. Ve a Console
3. Recarga la página
4. Busca mensajes de error

## 🔧 Soluciones Rápidas

### Solución 1: Reiniciar Todo
```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
cd backend
npm start
```

### Solución 2: Limpiar Caché del Navegador
1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. Selecciona "Vaciar caché y recargar de forma forzada"

### Solución 3: Verificar Firebase Console
1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto "tecnired-221e0"
3. Ve a Authentication > Sign-in method
4. Verifica que Google esté habilitado
5. Verifica que `localhost` esté en dominios autorizados

### Solución 4: Usar Configuración Hardcodeada Temporalmente
Si necesitas que funcione YA mientras debugueas, puedes temporalmente volver a hardcodear la config:

En `checkout.html`, reemplaza:
```javascript
const config = await loadFirebaseConfig();
```

Por:
```javascript
const config = {
  apiKey: "AIzaSyDkG2JyeF_mGwDx8dAL6BypVKLTzicSEe0",
  authDomain: "tecnired-221e0.firebaseapp.com",
  projectId: "tecnired-221e0",
  storageBucket: "tecnired-221e0.firebasestorage.app",
  appId: "1:247442670329:web:8a3215d5aeed054bd69828"
};
```

**⚠️ IMPORTANTE:** Esto es solo para debugging. Vuelve a la versión segura después.

## 📊 Checklist de Verificación

- [ ] Servidor corriendo en puerto 3000
- [ ] Endpoint `/api/firebase-config` responde con JSON
- [ ] Variables de entorno cargadas correctamente
- [ ] Botón de Google muestra "Continuar con Google (más rápido)"
- [ ] No hay errores en la consola del navegador
- [ ] Popup de Google se abre correctamente
- [ ] Después de seleccionar cuenta, redirige correctamente

## 🆘 Si Nada Funciona

1. **Revierte los cambios de seguridad temporalmente:**
   ```bash
   git stash
   ```

2. **Usa la versión anterior que funcionaba**

3. **Reporta el error exacto:**
   - Captura de pantalla de la consola
   - Mensaje de error completo
   - Pasos exactos para reproducir

## 📝 Notas Importantes

- El botón de Google ahora muestra "Cargando Google..." mientras inicializa
- Cuando esté listo, cambia a "Continuar con Google (más rápido)"
- Si hay error, muestra "Google no disponible" o "Error de configuración"
- Todos los errores se loguean en la consola del navegador

## ✅ Confirmación de Funcionamiento

Cuando todo funcione correctamente, deberías ver:

1. **En la consola del servidor:**
   ```
   🚀 Servidor corriendo en puerto 3000
   ```

2. **En la consola del navegador:**
   ```
   (Sin errores relacionados con Firebase)
   ```

3. **En la interfaz:**
   - Botón de Google habilitado
   - Click abre popup de Google
   - Seleccionar cuenta redirige correctamente
