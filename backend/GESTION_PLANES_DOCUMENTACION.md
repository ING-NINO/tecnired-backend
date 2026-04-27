# 📋 Gestión de Planes de Usuario - Documentación

## ✅ Funcionalidad Implementada

El administrador ahora puede **cambiar manualmente el plan** de cualquier usuario desde el panel de administración.

---

## 🎯 Características

### 1. **Columna Plan en Tablas**
- ✅ Ambas tablas (Clientes y Asesores) ahora muestran la columna **Plan**
- ✅ Badges de colores para identificar rápidamente el plan:
  - 🟢 **Gratis**: Badge gris
  - 🔵 **Estándar**: Badge azul
  - 🔴 **Premium**: Badge rojo

### 2. **Botón "Plan" en Acciones**
- ✅ Cada usuario tiene un botón con icono de corona (👑) para cambiar su plan
- ✅ Al hacer clic, se abre un prompt con las opciones disponibles

### 3. **Planes Disponibles**

#### 🟢 Plan Gratis
- **Límite**: 1 ticket/mes
- **Tiempo de respuesta**: 72 horas
- **Características**: Chat básico

#### 🔵 Plan Estándar
- **Límite**: 5 tickets/mes
- **Tiempo de respuesta**: 24 horas
- **Características**: 
  - Chat prioritario
  - Escalamiento N1-N2
  - Adjuntos permitidos
  - Soporte telefónico en horario laboral

#### 🔴 Plan Premium
- **Límite**: Tickets ilimitados
- **Tiempo de respuesta**: 4 horas (24/7)
- **Características**:
  - Asesor dedicado
  - Escalamiento completo (N1-N2-N3)
  - Videollamadas
  - Reportes personalizados
  - Soporte telefónico 24/7

---

## 🔧 Endpoints Backend

### **PUT** `/admin/usuarios/:id/plan`
Actualiza el plan de un usuario específico.

**Request Body:**
```json
{
  "plan": "gratis" | "estandar" | "premium"
}
```

**Response (éxito):**
```json
{
  "status": "ok",
  "message": "Plan actualizado correctamente"
}
```

**Response (error):**
```json
{
  "status": "fail",
  "message": "Plan no válido"
}
```

---

## 💻 Uso en la Interfaz

### Pasos para cambiar el plan de un usuario:

1. **Acceder al panel**: Ir a `/admin_usuarios.html`
2. **Seleccionar tab**: Elegir "Clientes" o "Asesores y Admins"
3. **Hacer clic en "👑 Plan"**: En la columna de acciones del usuario
4. **Ingresar nuevo plan**: Escribir `gratis`, `estandar` o `premium`
5. **Confirmar**: El sistema actualizará el plan y recargará la tabla

### Ejemplo de prompt:
```
Cambiar plan del usuario (actual: Gratis (1 ticket/mes))

Opciones:
- gratis (1 ticket/mes, respuesta 72h)
- estandar (5 tickets/mes, respuesta 24h, escalamiento N1-N2)
- premium (ilimitado, respuesta 4h, asesor dedicado)
```

---

## 🔒 Validaciones

### Backend:
- ✅ Solo acepta planes válidos: `gratis`, `estandar`, `premium`
- ✅ Retorna error si el plan no es válido
- ✅ Retorna error si el usuario no existe

### Frontend:
- ✅ Valida que el plan ingresado sea uno de los tres válidos
- ✅ Muestra mensaje de error si el plan no es válido
- ✅ Recarga automáticamente la tabla después de actualizar

---

## 📊 Impacto en el Sistema

### Límites de Tickets
Cuando un usuario crea un ticket, el sistema verifica:
1. ¿Qué plan tiene el usuario?
2. ¿Cuántos tickets ha creado este mes?
3. ¿Está dentro del límite de su plan?

Si el usuario alcanza el límite, recibe el mensaje:
```
Has alcanzado el límite de X tickets por mes. 
Actualiza tu plan para continuar.
```

### Usuarios de Google
- ✅ Los usuarios que inician sesión con Google reciben automáticamente el plan **Gratis**
- ✅ El administrador puede cambiar su plan manualmente después

---

## 🎨 Interfaz Visual

### Tabla de Clientes:
```
| ID | Nombre | Email | Plan | Teléfono | Acciones |
|----|--------|-------|------|----------|----------|
| 15 | Juan   | ...   | 🟢 Gratis | ... | 👑 Plan | ✏️ Rol | 🗑️ |
```

### Tabla de Asesores:
```
| ID | Nombre | Email | Rol | Plan | Teléfono | Acciones |
|----|--------|-------|-----|------|----------|----------|
| 10 | María  | ...   | Asesor | 🔵 Estándar | ... | 👑 Plan | ✏️ Rol | 🗑️ |
```

---

## 🚀 Próximos Pasos Sugeridos

1. **Historial de cambios**: Registrar cuándo y quién cambió el plan de un usuario
2. **Notificaciones**: Enviar email al usuario cuando su plan cambia
3. **Renovación automática**: Integrar con MercadoPago para renovaciones mensuales
4. **Dashboard de planes**: Mostrar estadísticas de cuántos usuarios hay por plan

---

## 📝 Notas Técnicas

- La columna `plan` en la tabla `usuarios` tiene valor por defecto `'gratis'`
- Todos los usuarios existentes fueron actualizados automáticamente con el plan gratis
- El sistema es compatible con la base de datos en Railway
- Los cambios se reflejan inmediatamente en el sistema de límites de tickets

---

## ✅ Estado: COMPLETADO

Fecha de implementación: 27 de abril de 2026
Versión: 1.0
