const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
require("dotenv").config();
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== CONFIGURACIÓN CORREO =====
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const correosNivel = {
  1: "cs7256082@gmail.com",
  2: "cs7256082@gmail.com",
  3: "cs7256082@gmail.com",
};

// ===== MIDDLEWARES =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ===== RUTA PRINCIPAL =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ===== REGISTRO =====
app.post("/register", (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  if (!nombre || !email || !password || !telefono) {
    return res.json({
      status: "fail",
      message: "Todos los campos son obligatorios",
    });
  }

  const verificar = "SELECT email FROM usuarios WHERE email = ?";
  db.query(verificar, [email], (err, result) => {
    if (err)
      return res.json({ status: "fail", message: "Error en verificación" });

    if (result.length > 0)
      return res.json({
        status: "fail",
        message: "El correo ya está registrado",
      });

    const sql =
      "INSERT INTO usuarios (nombre, email, password, telefono) VALUES (?, ?, ?, ?)";

    db.query(sql, [nombre, email, password, telefono], (err) => {
      if (err)
        return res.json({ status: "fail", message: "Error al registrar" });

      res.json({ status: "ok", message: "Usuario creado correctamente" });
    });
  });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql =
    "SELECT id, nombre, email, rol FROM usuarios WHERE email = ? AND password = ?";

  db.query(sql, [email, password], (err, rows) => {
    if (err)
      return res.json({ status: "fail", message: "Error en la consulta" });

    if (rows.length === 0)
      return res.json({ status: "fail", message: "Credenciales incorrectas" });

    res.json({ status: "ok", user: rows[0] });
  });
});

// ===== TICKETS DEL USUARIO =====
app.get("/tickets/usuario/:email", (req, res) => {
  const { email } = req.params;

  const sql = `
    SELECT t.*, COALESCE(u.telefono,'No registrado') AS telefono
    FROM tickets t
    LEFT JOIN usuarios u ON t.email = u.email
    WHERE t.email = ?
    ORDER BY t.id DESC
  `;

  db.query(sql, [email], (err, rows) => {
    if (err) {
      console.log("❌ Error tickets usuario:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

// ===== CREAR TICKET =====
app.post("/tickets", (req, res) => {
  const { nombre, email, categoria, descripcion } = req.body;

  if (!nombre || !email || !categoria || !descripcion) {
    return res.json({ status: "fail", message: "Datos incompletos" });
  }

  const sqlUsuario = "SELECT telefono FROM usuarios WHERE email = ?";

  db.query(sqlUsuario, [email], (err, usuarioRows) => {
    if (err || usuarioRows.length === 0) {
      console.log("❌ Error buscando usuario:", err);
      return res.json({
        status: "fail",
        message: "Usuario no encontrado",
      });
    }

    const validar =
      "SELECT COUNT(*) AS total FROM tickets WHERE email = ? AND estado IN ('Nuevo', 'Proceso')";

    db.query(validar, [email], (err, result) => {
      if (err) {
        console.log("❌ Error validando tickets:", err);
        return res.status(500).json({ status: "fail" });
      }

      if (result[0].total >= 3) {
        return res.json({
          status: "fail",
          message:
            "Ya tienes 3 tickets activos. Debes esperar a que se finalicen.",
        });
      }

      // 🔥 CORREGIDO: SIN telefono
      const sqlTicket = `
        INSERT INTO tickets
        (nombre, email, categoria, descripcion, prioridad, estado, escala, fecha)
        VALUES (?, ?, ?, ?, 'Pendiente', 'Nuevo', 'Seleccionar', NOW())
      `;

      db.query(sqlTicket, [nombre, email, categoria, descripcion], (err) => {
        if (err) {
          console.log("❌ Error insertando ticket:", err);
          return res.status(500).json({
            status: "fail",
            message: "Error al crear ticket",
          });
        }

        res.json({
          status: "ok",
          message: "Ticket creado correctamente",
        });
      });
    });
  });
});

// ===== TODOS LOS TICKETS (ADMIN) =====
app.get("/tickets", (req, res) => {
  const sql = `
    SELECT t.id, t.nombre, t.email,
           COALESCE(u.telefono,'No registrado') AS telefono,
           t.categoria, t.descripcion, t.estado,
           COALESCE(t.escala,'Seleccionar') AS escala, t.fecha
    FROM tickets t
    LEFT JOIN usuarios u ON t.email = u.email
    ORDER BY t.id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.log("❌ Error cargando tickets admin:", err);
      return res.status(500).json([]);
    }
    res.json(rows);
  });
});

// ===== CAMBIAR ESTADO =====
app.put("/tickets/:id", (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const sql = "UPDATE tickets SET estado = ? WHERE id = ?";

  db.query(sql, [estado, id], (err) => {
    if (err) return res.json({ status: "fail" });
    res.json({ status: "ok" });
  });
});

// ===== ESCALAR TICKET =====
app.put("/tickets/escalar/:id", (req, res) => {
  const { id } = req.params;
  const { escala } = req.body;

  const sql = "UPDATE tickets SET escala = ? WHERE id = ?";

  db.query(sql, [escala, id], (err) => {
    if (err) return res.json({ status: "fail", message: "Error actualizando" });

    const sqlTicket = `
      SELECT t.nombre, t.email, t.categoria, t.descripcion,
             COALESCE(u.telefono,'No registrado') AS telefono
      FROM tickets t
      LEFT JOIN usuarios u ON t.email = u.email
      WHERE t.id = ?
    `;

    db.query(sqlTicket, [id], (err, rows) => {
      if (err || rows.length === 0) return;

      const ticket = rows[0];

      const mailOptions = {
        from: "cs7256081@gmail.com",
        to: ticket.email,
        cc: correosNivel[escala],
        bcc: "cs7256081@gmail.com",
        subject: `Ticket Escalado a Nivel ${escala} - TecniRed`,
        html: `
          <div style="font-family: Arial; padding:20px;">
            <h2 style="color:#2c3e50;">Ticket Escalado - TecniRed</h2>
            <hr>
            <p><strong>Nombre Cliente:</strong> ${ticket.nombre}</p>
            <p><strong>Email Cliente:</strong> ${ticket.email}</p>
            <p><strong>Teléfono Cliente:</strong> ${ticket.telefono}</p>
            <p><strong>Categoría:</strong> ${ticket.categoria}</p>
            <p><strong>Descripción:</strong> ${ticket.descripcion}</p>
            <p><strong>Nivel Asignado:</strong> ${escala}</p>
            <br><hr>
            <p style="margin-top:20px; font-weight:bold;">
              Atentamente,<br>Equipo TecniRed
            </p>
            <img src="https://iili.io/qHaRGrQ.md.png" width="150" />
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log("❌ Error enviando correo:", error);
        else console.log("✅ Correo enviado:", info.response);
      });
    });

    res.json({ status: "ok" });
  });
});

// ===== FILTRAR POR FECHA =====
app.get("/admin/tickets", (req, res) => {
  const { inicio } = req.query;

  let sql = `
    SELECT t.id, t.nombre, t.email,
           COALESCE(u.telefono,'No registrado') AS telefono,
           t.categoria, t.descripcion, t.estado,
           COALESCE(t.escala,'Seleccionar') AS escala, t.fecha
    FROM tickets t
    LEFT JOIN usuarios u ON t.email = u.email
  `;

  const params = [];

  if (inicio) {
    sql += " WHERE DATE(t.fecha) = ?";
    params.push(inicio);
  }

  sql += " ORDER BY t.id DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json([]);
    res.json(rows);
  });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// ===== TICKETS PARA ASESOR SEGÚN NIVEL =====
app.get("/tickets/asesor/:email", (req, res) => {
  const { email } = req.params;

  const sqlUser = "SELECT rol FROM usuarios WHERE email = ?";

  db.query(sqlUser, [email], (err, user) => {
    if (err || user.length === 0) return res.json([]);

    const rol = user[0].rol;

    // ejemplo: asesor1 → nivel 1
    const nivel = rol.replace("asesor", "");

    const sql = `
      SELECT * FROM tickets
      WHERE escala = ?
      ORDER BY fecha DESC
    `;

    db.query(sql, [nivel], (err, rows) => {
      if (err) {
        console.log("❌ Error asesor tickets:", err);
        return res.json([]);
      }
      res.json(rows);
    });
  });
});
// OBTENER MENSAJES
app.get("/chat/:ticket", (req, res) => {
  db.query(
    "SELECT * FROM mensajes WHERE ticket_id = ? ORDER BY fecha ASC",
    [req.params.ticket],
    (err, rows) => {
      if (err) return res.json([]);
      res.json(rows);
    },
  );
});

// ENVIAR MENSAJE
app.post("/chat", (req, res) => {
  const { ticket_id, remitente, mensaje } = req.body;

  db.query(
    "INSERT INTO mensajes (ticket_id, remitente, mensaje) VALUES (?,?,?)",
    [ticket_id, remitente, mensaje],
    () => res.json({ ok: true }),
  );
});
