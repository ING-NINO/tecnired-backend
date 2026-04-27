# 📝 Sistema de Feedback y Calificación - TecniRed

## 🎯 Resumen

Se ha reemplazado la sección "Cuéntanos tu problema" por un **sistema completo de feedback** que permite a los usuarios enviar:
- 💬 Comentarios generales
- 💡 Sugerencias de mejora
- ⚠️ Reportar problemas
- 🎉 Felicitaciones

Además, incluye:
- ⭐ **Sistema de calificación con 5 estrellas** interactivo
- 📊 **Panel de administración** con estadísticas
- 🌐 **Integración de redes sociales** (Facebook, Instagram, Twitter, WhatsApp)

---

## 🔧 Archivos Modificados/Creados

### ✅ Frontend:
1. **`backend/public/index.html`** (MODIFICADO)
   - Sección de contacto reemplazada por sistema de feedback
   - Sistema de calificación con estrellas interactivas
   - Selector de tipo de mensaje
   - Enlaces a redes sociales con iconos

2. **`backend/public/admin_feedback.html`** (NUEVO)
   - Panel completo de administración de feedback
   - Estadísticas en tiempo real
   - Filtros por tipo, calificación y cantidad
   - Tarjetas visuales para cada feedback

3. **`backend/public/admin.html`** (MODIFICADO)
   - Botón "Ver Feedback" agregado en el header

### ✅ Backend:
4. **`backend/server.js`** (MODIFICADO)
   - Endpoint `POST /feedback` - Recibe y guarda feedback
   - Endpoint `GET /feedback/stats` - Estadísticas generales
   - Endpoint `GET /feedback` - Lista feedback con filtros
   - Tabla `feedback` creada automáticamente

---

## 📊 Estructura de la Base de Datos

### Tabla `feedback`:
```sql
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  tipo ENUM('comentario', 'sugerencia', 'problema', 'felicitacion') NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  mensaje TEXT NOT NULL,
  fecha DATETIME DEFAULT NOW(),
  INDEX idx_email (email),
  INDEX idx_rating (rating),
  INDEX idx_fecha (fecha)
);
```

**Campos:**
- `id`: Identificador único
- `nombre`: Nombre del usuario
- `email`: Correo electrónico
- `tipo`: Tipo de feedback (comentario, sugerencia, problema, felicitacion)
- `rating`: Calificación de 1 a 5 estrellas
- `mensaje`: Texto del feedback
- `fecha`: Fecha y hora de envío

---

## 🎨 Funcionalidades del Sistema de Calificación

### Sistema de Estrellas Interactivo:

```javascript
// Estados de las estrellas:
1 ⭐ = 😞 Muy Insatisfecho
2 ⭐⭐ = 😕 Insatisfecho
3 ⭐⭐⭐ = 😐 Neutral
4 ⭐⭐⭐⭐ = 😊 Satisfecho
5 ⭐⭐⭐⭐⭐ = 🤩 Muy Satisfecho
```

**Efectos visuales:**
- Hover: Las estrellas se iluminan al pasar el mouse
- Click: Se fija la calificación seleccionada
- Color dinámico según calificación:
  - Verde (4-5 estrellas)
  - Amarillo (3 estrellas)
  - Rojo (1-2 estrellas)

---

## 🌐 Redes Sociales Integradas

### Enlaces Configurados:

1. **Facebook** 
   - URL: `https://facebook.com/tecnired`
   - Color: #1877f2 (Azul Facebook)
   - Icono: `fa-brands fa-facebook`

2. **Instagram**
   - URL: `https://instagram.com/tecnired`
   - Color: #e1306c (Rosa Instagram)
   - Icono: `fa-brands fa-instagram`

3. **Twitter**
   - URL: `https://twitter.com/tecnired`
   - Color: #1da1f2 (Azul Twitter)
   - Icono: `fa-brands fa-twitter`

4. **WhatsApp**
   - URL: `https://wa.me/573001234567`
   - Color: #25d366 (Verde WhatsApp)
   - Icono: `fa-brands fa-whatsapp`

**Nota:** Actualizar las URLs con las cuentas reales de TecniRed.

---

## 📈 Panel de Administración

### Estadísticas Disponibles:

1. **Total Feedback** 📝
   - Cantidad total de feedback recibido

2. **Calificación Promedio** ⭐
   - Promedio de todas las calificaciones (1-5)

3. **Feedback Positivo** 😊
   - Cantidad de calificaciones ≥ 4 estrellas

4. **Feedback Negativo** 😞
   - Cantidad de calificaciones ≤ 2 estrellas

5. **Usuarios Únicos** 👥
   - Cantidad de emails diferentes que enviaron feedback

### Filtros Disponibles:

**Por Tipo:**
- Todos
- 💬 Comentarios
- 💡 Sugerencias
- ⚠️ Problemas
- 🎉 Felicitaciones

**Por Calificación:**
- Todas
- ⭐⭐⭐⭐⭐ (5 estrellas)
- ⭐⭐⭐⭐ (4 estrellas)
- ⭐⭐⭐ (3 estrellas)
- ⭐⭐ (2 estrellas)
- ⭐ (1 estrella)

**Por Cantidad:**
- 50 más recientes
- 100 más recientes
- Todos

---

## 🔐 Validaciones Implementadas

### Frontend:
✅ Todos los campos son obligatorios  
✅ Email debe ser válido  
✅ Calificación debe estar seleccionada (1-5)  
✅ Tipo de mensaje debe estar seleccionado  

### Backend:
✅ Validación de campos obligatorios  
✅ Validación de rating entre 1 y 5  
✅ Validación de tipo de feedback válido  
✅ Sanitización de datos antes de guardar  

---

## 🎯 Flujo del Usuario

### 1️⃣ Usuario en la Página Principal:
```
Scroll hasta sección "Contacto" → 
Completa formulario (nombre, email, tipo, calificación, mensaje) →
Clic en "Enviar Feedback" →
Confirmación visual "¡Gracias por tu feedback!"
```

### 2️⃣ Admin Revisa Feedback:
```
Login como admin →
Clic en "Ver Feedback" (botón verde en header) →
Ve estadísticas generales →
Aplica filtros según necesidad →
Revisa feedback individual
```

---

## 📊 Endpoints de la API

### 1. POST `/feedback`
**Descripción:** Recibe y guarda nuevo feedback

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@correo.com",
  "tipo": "sugerencia",
  "rating": 5,
  "mensaje": "Excelente servicio, muy rápido"
}
```

**Respuesta exitosa:**
```json
{
  "status": "ok",
  "message": "Feedback guardado correctamente",
  "id": 123
}
```

---

### 2. GET `/feedback/stats`
**Descripción:** Obtiene estadísticas generales

**Respuesta:**
```json
{
  "status": "ok",
  "stats": {
    "total": 150,
    "promedio_rating": 4.3,
    "positivos": 120,
    "negativos": 10,
    "usuarios_unicos": 85
  },
  "porTipo": [
    { "tipo": "comentario", "cantidad": 50 },
    { "tipo": "sugerencia", "cantidad": 40 },
    { "tipo": "problema", "cantidad": 30 },
    { "tipo": "felicitacion", "cantidad": 30 }
  ]
}
```

---

### 3. GET `/feedback?tipo=sugerencia&rating=5&limit=50`
**Descripción:** Lista feedback con filtros opcionales

**Parámetros:**
- `tipo` (opcional): comentario, sugerencia, problema, felicitacion
- `rating` (opcional): 1, 2, 3, 4, 5
- `limit` (opcional): cantidad máxima de resultados

**Respuesta:**
```json
{
  "status": "ok",
  "feedback": [
    {
      "id": 123,
      "nombre": "Juan Pérez",
      "email": "juan@correo.com",
      "tipo": "sugerencia",
      "rating": 5,
      "mensaje": "Sería genial tener...",
      "fecha": "2026-04-27T10:30:00.000Z"
    }
  ]
}
```

---

## 🎨 Diseño Visual

### Colores por Tipo de Feedback:

| Tipo | Color Fondo | Color Texto | Icono |
|------|-------------|-------------|-------|
| Comentario | #e3f2fd | #1976d2 | 💬 |
| Sugerencia | #fff3e0 | #f57c00 | 💡 |
| Problema | #ffebee | #d32f2f | ⚠️ |
| Felicitación | #e8f5e9 | #388e3c | 🎉 |

### Efectos de Interacción:

**Estrellas:**
- Hover: Escala 1.2x + Color dorado
- Click: Fija calificación + Muestra texto

**Redes Sociales:**
- Hover: Elevación -4px + Sombra
- Transición suave 0.3s

**Tarjetas de Feedback:**
- Hover: Elevación -5px + Sombra más intensa

---

## 🚀 Mejoras Futuras Sugeridas

### Funcionalidades Adicionales:

1. **Respuestas del Admin**
   - Permitir que el admin responda directamente al feedback
   - Notificar al usuario por email

2. **Análisis de Sentimiento**
   - Integrar IA para analizar el tono del mensaje
   - Clasificar automáticamente como positivo/negativo/neutral

3. **Exportación de Datos**
   - Exportar feedback a CSV/Excel
   - Generar reportes PDF

4. **Gráficos y Tendencias**
   - Gráfico de evolución de calificaciones
   - Tendencias por mes/semana

5. **Notificaciones en Tiempo Real**
   - Notificar al admin cuando llega feedback negativo (≤2 estrellas)
   - Alertas por email para problemas críticos

6. **Sistema de Recompensas**
   - Agradecer a usuarios que dejan feedback positivo
   - Cupones de descuento por participación

---

## 🧪 Cómo Probar

### Paso 1: Enviar Feedback desde la Web
1. Ir a `http://localhost:3000`
2. Scroll hasta la sección "Comentarios y Calificación"
3. Completar el formulario:
   - Nombre: "Juan Pérez"
   - Email: "juan@test.com"
   - Tipo: "Sugerencia"
   - Calificación: 5 estrellas
   - Mensaje: "Excelente servicio"
4. Clic en "Enviar Feedback"
5. Verificar mensaje de confirmación

### Paso 2: Ver Feedback en el Admin
1. Login como admin
2. Clic en botón verde "Ver Feedback"
3. Verificar que aparece el feedback enviado
4. Probar filtros (tipo, calificación, límite)
5. Verificar estadísticas actualizadas

### Paso 3: Probar Redes Sociales
1. Clic en cada red social
2. Verificar que abre en nueva pestaña
3. Actualizar URLs con cuentas reales

---

## 📞 Actualizar URLs de Redes Sociales

En `backend/public/index.html`, buscar y reemplazar:

```html
<!-- ACTUALIZAR ESTAS URLs -->
<a href="https://facebook.com/tecnired" target="_blank">
<a href="https://instagram.com/tecnired" target="_blank">
<a href="https://twitter.com/tecnired" target="_blank">
<a href="https://wa.me/573001234567" target="_blank">
```

**Reemplazar con:**
- Facebook: URL real de la página de TecniRed
- Instagram: @usuario_real
- Twitter: @usuario_real
- WhatsApp: Número real con código de país (ej: 573001234567)

---

## ✅ Checklist de Implementación

- [x] Sistema de feedback con 4 tipos de mensajes
- [x] Calificación con 5 estrellas interactivas
- [x] Validaciones frontend y backend
- [x] Tabla `feedback` en base de datos
- [x] Endpoint POST `/feedback`
- [x] Endpoint GET `/feedback/stats`
- [x] Endpoint GET `/feedback` con filtros
- [x] Panel de administración completo
- [x] Estadísticas en tiempo real
- [x] Filtros por tipo, calificación y cantidad
- [x] Integración de redes sociales
- [x] Efectos visuales y animaciones
- [x] Diseño responsive
- [x] Documentación completa

---

## 🎉 ¡Sistema Completo!

El sistema de feedback está **100% funcional** y listo para recibir opiniones de los clientes. Los administradores pueden ver estadísticas detalladas y filtrar feedback según sus necesidades.

**Beneficios:**
- ✅ Conocer la satisfacción de los clientes
- ✅ Identificar áreas de mejora
- ✅ Detectar problemas rápidamente
- ✅ Aumentar engagement con redes sociales
- ✅ Tomar decisiones basadas en datos reales

---

**Desarrollado para TecniRed** 🚀  
**Fecha:** Abril 2026  
**Versión:** 1.0
