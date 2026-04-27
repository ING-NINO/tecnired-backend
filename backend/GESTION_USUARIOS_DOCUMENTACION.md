# 📋 Gestión de Usuarios - Documentación

## ✅ Implementación Completada

### 🎯 Funcionalidades

#### 1. **Separación por Tabs**
- **Tab Clientes**: Muestra solo usuarios con rol `cliente`
- **Tab Asesores y Admins**: Muestra usuarios con roles `asesor`, `asesor1`, `asesor2`, `asesor3`, `admin`
- Contadores dinámicos en cada tab
- Cambio de tab sin recargar la página

#### 2. **Gestión Completa de Usuarios**
- ✅ **Crear usuarios**: Asesores, admins o clientes desde el panel
- ✅ **Eliminar usuarios**: Con protección para el admin principal (ID 1)
- ✅ **Cambiar roles**: Actualizar el rol de cualquier usuario
- ✅ **Visualización separada**: Clientes en una tabla, asesores/admins en otra

#### 3. **Información Mostrada**

**Tabla de Clientes:**
- ID
- Nombre
- Email
- Plan (gratis/estándar/premium)
- Teléfono
- Fecha de registro
- Acciones (cambiar rol, eliminar)

**Tabla de Asesores:**
- ID
- Nombre
- Email
- Rol (asesor/asesor1/asesor2/asesor3/admin)
- Teléfono
- Fecha de registro
- Acciones (cambiar rol, eliminar)

---

## 🔧 Endpoints Backend

### `GET /admin/usuarios`
Lista todos los usuarios del sistema.

**Respuesta:**
```json
{
  "status": "ok",
  "usuarios": [
    {
      "id": 1,
      "nombre": "Admin Principal",
      "email": "admin@tecnired.com",
      "rol": "admin",
      "telefono": "300 123 4567",
      "plan": "premium",
      "fecha_registro": "2026-01-15"
    }
  ]
}
```

### `POST /admin/usuarios`
Crea un nuevo usuario (asesor, admin o cliente).

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "Password123!",
  "telefono": "300 456 7890",
  "rol": "asesor1"
}
```

**Roles válidos:**
- `cliente`
- `asesor` (general)
- `asesor1` (Nivel 1)
- `asesor2` (Nivel 2)
- `asesor3` (Nivel 3)
- `admin`

### `DELETE /admin/usuarios/:id`
Elimina un usuario por ID.

**Protección:** No permite eliminar al admin principal (ID 1)

### `PUT /admin/usuarios/:id/rol`
Cambia el rol de un usuario.

**Body:**
```json
{
  "rol": "asesor2"
}
```

---

## 🎨 Interfaz de Usuario

### Características Visuales
- ✨ Diseño moderno con fondo animado (canvas con partículas)
- 🎨 Tabs interactivos con contadores en tiempo real
- 🏷️ Badges de colores según rol:
  - **Admin**: Rojo
  - **Asesor**: Azul (primary)
  - **Cliente**: Gris
- 📱 Responsive y adaptable a móviles
- 🔄 Actualización automática cada 30 segundos

### Modal de Creación
- Formulario completo con validación
- Campos: nombre, email, contraseña, teléfono, rol
- Botones de cancelar y crear
- Cierre automático al crear exitosamente

---

## 🔐 Seguridad

1. **Protección del Admin Principal**
   - No se puede eliminar al usuario con ID 1
   - Previene eliminación accidental del administrador

2. **Validación de Roles**
   - Solo acepta roles predefinidos
   - Rechaza roles inválidos

3. **Contraseñas Hasheadas**
   - Usa `pbkdf2` con 120,000 iteraciones
   - Salt único por usuario
   - Almacenamiento seguro en BD

---

## 📊 Flujo de Datos

```
1. Usuario admin accede a /admin_usuarios.html
2. JavaScript carga todos los usuarios desde /admin/usuarios
3. Separa usuarios en dos arrays:
   - clientesData (rol === 'cliente')
   - asesoresData (rol !== 'cliente')
4. Renderiza ambas tablas
5. Actualiza contadores en los tabs
6. Usuario puede:
   - Cambiar entre tabs
   - Crear nuevos usuarios
   - Eliminar usuarios existentes
   - Cambiar roles
7. Actualización automática cada 30 segundos
```

---

## 🚀 Acceso

**URL:** `/admin_usuarios.html`

**Desde el panel admin:**
- Botón "Usuarios" en el header (color morado)
- Ubicado junto a "Ver Feedback"

---

## 📝 Notas Técnicas

### Separación de Usuarios
```javascript
// Clientes: solo rol 'cliente'
clientesData = data.usuarios.filter(u => u.rol === 'cliente');

// Asesores: todos los demás roles
asesoresData = data.usuarios.filter(u => u.rol !== 'cliente');
```

### Renderizado Dinámico
- Cada tab tiene su propia función de renderizado
- `renderizarClientes()` → tabla de clientes
- `renderizarAsesores()` → tabla de asesores
- Actualización independiente de cada tabla

### Actualización en Tiempo Real
- `setInterval(cargarUsuarios, 30000)` → cada 30 segundos
- Mantiene sincronización con la base de datos
- No requiere recargar la página manualmente

---

## ✅ Estado Actual

**TASK 5: Gestión de Usuarios y Reapertura de Tickets**
- ✅ Endpoints backend implementados
- ✅ Página admin_usuarios.html creada
- ✅ Tabs de Clientes y Asesores funcionando
- ✅ JavaScript actualizado para separación de usuarios
- ✅ Botón "Usuarios" agregado en admin.html
- ✅ Función reabrirTicket() implementada

**STATUS:** ✅ COMPLETADO

---

## 🎯 Próximos Pasos (Opcional)

1. **Búsqueda y Filtros**
   - Buscar usuarios por nombre/email
   - Filtrar por rol específico
   - Filtrar por plan

2. **Exportación**
   - Exportar lista de usuarios a CSV/Excel
   - Generar reportes de usuarios

3. **Estadísticas**
   - Gráficos de usuarios por rol
   - Usuarios activos vs inactivos
   - Distribución de planes

4. **Permisos Granulares**
   - Definir qué puede hacer cada rol
   - Restricciones por nivel de asesor
