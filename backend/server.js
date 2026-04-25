const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
require("dotenv").config();
const nodemailer = require("nodemailer");
const http = require("http");
const { Server } = require("socket.io");

// ===== APP + SERVER =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

// ===== EMAIL =====
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

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

// ===== SOCKET =====
io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado");

  socket.on("joinTicket", (ticketId) => {
    socket.join("ticket_" + ticketId);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado");
  });
});

// ===== ROOT =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  if (!nombre || !email || !password || !telefono) {
    return res.json({ status: "fail", message: "Campos obligatorios" });
  }

  db.query("SELECT email FROM usuarios WHERE email = ?", [email], (err, r) => {
    if (err) return res.json({ status: "fail" });

    if (r.length > 0)
      return res.json({ status: "fail", message: "Correo ya existe" });

    db.query(
      "INSERT INTO usuarios (nombre,email,password,telefono) VALUES (?,?,?,?)",
      [nombre, email, password, telefono],
      (err) => {
        if (err) return res.json({ status: "fail" });
        res.json({ status: "ok" });
      },
    );
  });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT id,nombre,email,rol FROM usuarios WHERE email=? AND password=?",
    [email, password],
    (err, rows) => {
      if (err) return res.json({ status: "fail" });
      if (!rows.length)
        return res.json({
          status: "fail",
          message: "Credenciales incorrectas",
        });

      res.json({ status: "ok", user: rows[0] });
    },
  );
});

// ===== TICKETS USUARIO =====
app.get("/tickets/usuario/:email", (req, res) => {
  db.query(
    `SELECT t.*, COALESCE(u.telefono,'No registrado') AS telefono
     FROM tickets t
     LEFT JOIN usuarios u ON t.email = u.email
     WHERE t.email = ?
     ORDER BY t.id DESC`,
    [req.params.email],
    (err, rows) => {
      if (err) return res.status(500).json([]);
      res.json(rows);
    },
  );
});

// ===== CREAR TICKET =====
app.post("/tickets", (req, res) => {
  const { nombre, email, categoria, descripcion } = req.body;

  db.query(
    `INSERT INTO tickets 
    (nombre,email,categoria,descripcion,prioridad,estado,escala,fecha)
    VALUES (?,?,?,?, 'Pendiente','Nuevo','Seleccionar',NOW())`,
    [nombre, email, categoria, descripcion],
    (err) => {
      if (err) return res.status(500).json({ status: "fail" });
      res.json({ status: "ok" });
    },
  );
});

// ===== ADMIN TODOS LOS TICKETS =====
app.get("/tickets", (req, res) => {
  db.query(
    `SELECT t.id, t.nombre, t.email,
    COALESCE(u.telefono,'No registrado') AS telefono,
    t.categoria, t.descripcion, t.estado,
    COALESCE(t.escala,'Seleccionar') AS escala, t.fecha
    FROM tickets t
    LEFT JOIN usuarios u ON t.email = u.email
    ORDER BY t.id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json([]);
      res.json(rows);
    },
  );
});

// ===== CAMBIAR ESTADO =====
app.get("/tickets/detalle/:id", (req, res) => {
  db.query(
    "SELECT * FROM tickets WHERE id=?",
    [req.params.id],
    (err, rows) => {
      if (err) return res.status(500).json({ status: "fail" });
      if (!rows.length) return res.status(404).json({ status: "not_found" });
      res.json(rows[0]);
    },
  );
});

app.put("/tickets/:id", (req, res) => {
  db.query(
    "UPDATE tickets SET estado=? WHERE id=?",
    [req.body.estado, req.params.id],
    () => {
      if (req.body.estado === "Finalizado") {
        io.to("ticket_" + req.params.id).emit("ticketFinalizado", {
          ticket_id: req.params.id,
        });
      }

      res.json({ status: "ok" });
    },
  );
});

// ===== ESCALAR =====
app.put("/tickets/escalar/:id", (req, res) => {
  const { escala } = req.body;

  db.query(
    "UPDATE tickets SET escala=? WHERE id=?",
    [escala, req.params.id],
    () => {
      res.json({ status: "ok" });
    },
  );
});

// ===== FILTRO ADMIN =====
app.get("/admin/tickets", (req, res) => {
  const { inicio } = req.query;

  let sql = `SELECT * FROM tickets`;
  let params = [];

  if (inicio) {
    sql += " WHERE DATE(fecha)=?";
    params.push(inicio);
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.json([]);
    res.json(rows);
  });
});

// ===== TICKETS ASESOR =====
app.get("/tickets/asesor/:email", (req, res) => {
  db.query(
    "SELECT rol FROM usuarios WHERE email=?",
    [req.params.email],
    (err, user) => {
      if (err || !user.length) return res.json([]);

      const rol = String(user[0].rol || "")
        .toLowerCase()
        .trim();
      const nivel = rol.match(/\d+/)?.[0];

      // Si el rol viene como "asesor1", "asesor 1" o "asesor_n1" se filtra por nivel.
      // Si el rol es "asesor" sin nivel, se listan todos los tickets escalados.
      const sql = nivel
        ? "SELECT * FROM tickets WHERE escala=? ORDER BY fecha DESC"
        : `SELECT * FROM tickets
           WHERE escala IN ('1','2','3')
           ORDER BY fecha DESC`;
      const params = nivel ? [nivel] : [];

      db.query(sql, params, (err, rows) => {
        if (err) return res.json([]);
        res.json(rows);
      });
    },
  );
});

// ===== CHAT =====
app.get("/chat/:ticket", (req, res) => {
  db.query(
    "SELECT * FROM mensajes WHERE ticket_id=? ORDER BY fecha ASC",
    [req.params.ticket],
    (err, rows) => {
      if (err) return res.json([]);
      res.json(rows);
    },
  );
});

// ===== MENSAJE (🔥 CLAVE FINAL) =====
app.post("/chat", (req, res, next) => {
  db.query(
    "SELECT estado FROM tickets WHERE id=?",
    [req.body.ticket_id],
    (err, rows) => {
      if (err) return res.status(500).json({ ok: false });
      if (!rows.length) return res.status(404).json({ ok: false });
      if (rows[0].estado === "Finalizado") {
        return res.status(403).json({
          ok: false,
          message: "El ticket ya fue finalizado",
        });
      }

      next();
    },
  );
});

app.post("/chat", (req, res) => {
  const { ticket_id, remitente, mensaje } = req.body;

  db.query(
    "INSERT INTO mensajes (ticket_id,remitente,mensaje) VALUES (?,?,?)",
    [ticket_id, remitente, mensaje],
    (err, result) => {
      if (err) return res.status(500).json({ ok: false });

      // 🔥 TIEMPO REAL
      io.to("ticket_" + ticket_id).emit("nuevoMensaje", {
        id: result.insertId,
        ticket_id,
        remitente,
        mensaje,
      });

      res.json({ ok: true });
    },
  );
});

// ===== START =====
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
