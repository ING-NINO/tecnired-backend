const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
require("dotenv").config();
const nodemailer = require("nodemailer");
const http = require("http");
const { Server } = require("socket.io");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ===== APP + SERVER =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

// ===== CLOUDINARY =====
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let tipo = "image";

    if (file.mimetype === "application/pdf") {
      tipo = "raw";
    } else if (file.mimetype.startsWith("video")) {
      tipo = "video";
    }

    return {
      folder: "tecnired",
      resource_type: tipo,

      // 🔥 CLAVE REAL (esto arregla el PDF)
      format: file.mimetype === "application/pdf" ? "pdf" : undefined,

      public_id: file.originalname
        .replace(/\s+/g, "_") // 🔥 quita espacios
        .replace(".pdf", ""), // limpia extensión,
    };
  },
});
const upload = multer({ storage });

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
app.put("/tickets/:id", (req, res) => {
  db.query(
    "UPDATE tickets SET estado=? WHERE id=?",
    [req.body.estado, req.params.id],
    () => res.json({ status: "ok" }),
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
      if (!user.length) return res.json([]);

      const nivel = user[0].rol.replace("asesor", "");

      db.query(
        "SELECT * FROM tickets WHERE escala=? ORDER BY fecha DESC",
        [nivel],
        (err, rows) => {
          if (err) return res.json([]);
          res.json(rows);
        },
      );
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

// ===== MENSAJE =====
app.post("/chat", (req, res) => {
  const { ticket_id, remitente, mensaje } = req.body;

  db.query(
    "INSERT INTO mensajes (ticket_id,remitente,mensaje) VALUES (?,?,?)",
    [ticket_id, remitente, mensaje],
    (err, result) => {
      if (err) return res.status(500).json({ ok: false });

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

// ===== ARCHIVOS =====
app.post("/chat/file", upload.single("archivo"), (req, res) => {
  const { ticket_id, remitente } = req.body;

  if (!req.file) return res.json({ ok: false });

  const url = req.file.secure_url || req.file.path;

  db.query(
    "INSERT INTO mensajes (ticket_id,remitente,mensaje) VALUES (?,?,?)",
    [ticket_id, remitente, url],
    (err, result) => {
      if (err) return res.status(500).json({ ok: false });

      io.to("ticket_" + ticket_id).emit("nuevoMensaje", {
        id: result.insertId,
        ticket_id,
        remitente,
        mensaje: url,
      });

      res.json({ ok: true });
    },
  );
});

// ===== START =====
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
