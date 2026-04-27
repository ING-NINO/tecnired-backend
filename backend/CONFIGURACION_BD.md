# 🔧 Configuración de Base de Datos

## ❌ Problema Actual

El servidor no puede conectarse a MySQL porque las credenciales en el archivo `.env` no son correctas.

**Error actual:**
```
Access denied for user 'root'@'localhost' (using password: NO/YES)
```

---

## ✅ Solución

### Paso 1: Encontrar tus credenciales de MySQL

Necesitas saber:
1. **Usuario** de MySQL (normalmente `root`)
2. **Contraseña** de MySQL
3. **Nombre de la base de datos** (actualmente configurado como `tecnired`)
4. **Puerto** (normalmente `3306`)

### Paso 2: Actualizar el archivo `.env`

Abre el archivo `backend/.env` y actualiza estas líneas con tus credenciales correctas:

```env
# ===== BASE DE DATOS =====
DB_HOST=localhost
DB_USER=root                    # 👈 Tu usuario de MySQL
DB_PASSWORD=TU_CONTRASEÑA_AQUI  # 👈 Tu contraseña de MySQL
DB_NAME=tecnired                # 👈 Nombre de tu base de datos
DB_PORT=3306                    # 👈 Puerto de MySQL
```

### Paso 3: Verificar que la base de datos existe

Abre MySQL Workbench o tu cliente de MySQL favorito y ejecuta:

```sql
-- Ver todas las bases de datos
SHOW DATABASES;

-- Si 'tecnired' no existe, créala:
CREATE DATABASE tecnired CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE tecnired;

-- Ver las tablas existentes
SHOW TABLES;
```

### Paso 4: Verificar que tienes usuarios

```sql
-- Ver todos los usuarios
SELECT * FROM usuarios;

-- Si no hay usuarios, puedes crear uno de prueba:
INSERT INTO usuarios (nombre, email, password, telefono, rol, plan, fecha_registro)
VALUES 
('Admin Principal', 'admin@tecnired.com', 'pbkdf2$120000$salt$hash', '300 123 4567', 'admin', 'premium', NOW()),
('Cliente Prueba', 'cliente@test.com', 'pbkdf2$120000$salt$hash', '300 456 7890', 'cliente', 'gratis', NOW()),
('Asesor Prueba', 'asesor@test.com', 'pbkdf2$120000$salt$hash', '300 789 0123', 'asesor1', 'gratis', NOW());
```

---

## 🔍 Cómo encontrar tu contraseña de MySQL

### Opción 1: MySQL Workbench
Si usas MySQL Workbench, la contraseña está guardada en tus conexiones guardadas.

### Opción 2: Resetear la contraseña de root

Si no recuerdas la contraseña, puedes resetearla:

1. Detén el servicio MySQL:
   ```powershell
   Stop-Service MySQL80
   ```

2. Inicia MySQL en modo seguro (sin contraseña):
   ```powershell
   mysqld --skip-grant-tables
   ```

3. En otra terminal, conéctate sin contraseña:
   ```powershell
   mysql -u root
   ```

4. Cambia la contraseña:
   ```sql
   USE mysql;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'nueva_contraseña';
   FLUSH PRIVILEGES;
   EXIT;
   ```

5. Reinicia MySQL normalmente:
   ```powershell
   Start-Service MySQL80
   ```

### Opción 3: Crear un nuevo usuario

Si no quieres usar `root`, puedes crear un usuario específico para la aplicación:

```sql
-- Conectarse como root
mysql -u root -p

-- Crear usuario
CREATE USER 'tecnired_user'@'localhost' IDENTIFIED BY 'tu_contraseña_segura';

-- Dar permisos completos sobre la base de datos tecnired
GRANT ALL PRIVILEGES ON tecnired.* TO 'tecnired_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;
```

Luego actualiza el `.env`:
```env
DB_USER=tecnired_user
DB_PASSWORD=tu_contraseña_segura
```

---

## 🚀 Después de configurar

1. Guarda el archivo `.env`
2. Reinicia el servidor Node.js
3. Deberías ver en la consola:
   ```
   ✅ MySQL conectado
   ✅ Tabla chat_interno lista
   ✅ Columna plan lista
   ✅ Tabla feedback lista
   ```

4. Accede a `http://localhost:3000/admin_usuarios.html`
5. Deberías ver tus usuarios listados en las tabs de Clientes y Asesores

---

## 📞 Necesitas ayuda?

Si sigues teniendo problemas, comparte:
1. El mensaje de error completo
2. La versión de MySQL que usas
3. Si puedes conectarte con MySQL Workbench o algún otro cliente

---

## ⚠️ Importante

**NUNCA** compartas tu archivo `.env` completo en público, ya que contiene:
- Contraseñas de base de datos
- Claves de API de MercadoPago
- Credenciales de email
- Tokens de acceso

Mantén este archivo seguro y fuera del control de versiones (ya está en `.gitignore`).
