const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
require("dotenv").config();
const nodemailer = require("nodemailer");
const http = require("http");
const crypto = require("crypto");
const { Server } = require("socket.io");

// ===== APP + SERVER =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;
const FIREBASE_API_KEY = "AIzaSyDkG2JyeF_mGwDx8dAL6BypVKLTzicSEe0";

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

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validarPassword(password) {
  return PASSWORD_RULE.test(String(password || ""));
}

function crearHashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 120000, 32, "sha256")
    .toString("hex");
  return `pbkdf2$120000$${salt}$${hash}`;
}

function verificarPassword(password, storedPassword) {
  if (!storedPassword) return false;

  if (!String(storedPassword).startsWith("pbkdf2$")) {
    return password === storedPassword;
  }

  const [, iterations, salt, hash] = storedPassword.split("$");
  if (!iterations || !salt || !hash) return false;

  const candidate = crypto
    .pbkdf2Sync(password, salt, Number(iterations), 32, "sha256")
    .toString("hex");

  if (candidate.length !== hash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

async function verificarFirebaseToken(idToken) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) return null;

  const data = await response.json();
  const firebaseUser = data.users?.[0];
  if (!firebaseUser?.email || firebaseUser.emailVerified === false) return null;

  return {
    nombre: firebaseUser.displayName || "Cliente Google",
    email: firebaseUser.email,
  };
}

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

  // Sala de ticket cliente/asesor
  socket.on("joinTicket", (ticketId) => {
    socket.join("ticket_" + ticketId);
  });

  // Sala del admin (para notificaciones y chat interno)
  socket.on("joinAdmin", () => {
    socket.join("admin_room");
  });

  // Chat interno admin <-> asesores — persiste en BD y retransmite
  socket.on("mensajeInterno", (data) => {
    const { remitente, texto, hora } = data;
    if (!remitente || !texto) return;

    db.query(
      "INSERT INTO chat_interno (remitente, texto, hora) VALUES (?, ?, NOW())",
      [remitente, texto],
      (err, result) => {
        if (err) {
          // Si la tabla no existe aún, igual retransmitimos en memoria
          console.error("chat_interno insert error:", err.message);
        }
        // Emitir a todos en admin_room (admin + asesores)
        io.to("admin_room").emit("mensajeInterno", {
          id: result ? result.insertId : Date.now(),
          remitente,
          texto,
          hora,
        });
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("🔴 Usuario desconectado");
  });
});

// ===== ROOT =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ===== CREAR TABLA CHAT INTERNO SI NO EXISTE =====
db.query(`
  CREATE TABLE IF NOT EXISTS chat_interno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    remitente VARCHAR(255) NOT NULL,
    texto TEXT NOT NULL,
    hora DATETIME DEFAULT NOW()
  )
`, (err) => {
  if (err) console.error("No se pudo crear tabla chat_interno:", err.message);
  else console.log("✅ Tabla chat_interno lista");
});

// ===== HISTORIAL CHAT INTERNO =====
app.get("/chat-interno", (req, res) => {
  db.query(
    "SELECT * FROM chat_interno ORDER BY hora ASC LIMIT 200",
    (err, rows) => {
      if (err) return res.json([]);
      res.json(rows);
    }
  );
});

// ===== REGISTER =====
app.post("/register", (req, res) => {
  const { nombre, email, password, telefono } = req.body;

  if (!nombre || !email || !password || !telefono) {
    return res.json({ status: "fail", message: "Campos obligatorios" });
  }

  if (!validarPassword(password)) {
    return res.json({
      status: "fail",
      message:
        "La contrasena debe tener minimo 8 caracteres, mayuscula, minuscula, numero y simbolo.",
    });
  }

  db.query("SELECT email FROM usuarios WHERE email = ?", [email], (err, r) => {
    if (err) return res.json({ status: "fail" });

    if (r.length > 0)
      return res.json({ status: "fail", message: "Correo ya existe" });

    db.query(
      "INSERT INTO usuarios (nombre,email,password,telefono) VALUES (?,?,?,?)",
      [nombre, email, crearHashPassword(password), telefono],
      (err) => {
        if (err) return res.json({ status: "fail" });
        res.json({ status: "ok", message: "Cuenta creada correctamente" });
      },
    );
  });
});

// ===== LOGIN =====
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT id,nombre,email,rol,password FROM usuarios WHERE email=?",
    [email],
    (err, rows) => {
      if (err) return res.json({ status: "fail" });
      if (!rows.length || !verificarPassword(password, rows[0].password))
        return res.json({
          status: "fail",
          message: "Credenciales incorrectas",
        });

      const { password: _password, ...user } = rows[0];
      res.json({ status: "ok", user });
    },
  );
});

// ===== GOOGLE AUTH =====
app.post("/auth/google", async (req, res) => {
  let googleUser;

  try {
    googleUser = await verificarFirebaseToken(req.body.idToken);
  } catch (error) {
    return res.json({ status: "fail", message: "No se pudo validar Google" });
  }

  if (!googleUser) {
    return res.json({ status: "fail", message: "No se pudo validar Google" });
  }

  const { nombre, email } = googleUser;

  db.query(
    "SELECT id,nombre,email,rol FROM usuarios WHERE email=?",
    [email],
    (err, rows) => {
      if (err) return res.json({ status: "fail" });

      if (rows.length) {
        return res.json({ status: "ok", user: rows[0] });
      }

      db.query(
        "INSERT INTO usuarios (nombre,email,password,telefono) VALUES (?,?,?,?)",
        [nombre, email, crearHashPassword(crypto.randomBytes(32).toString("hex")), "Google"],
        (err, result) => {
          if (err) return res.json({ status: "fail" });

          res.json({
            status: "ok",
            user: {
              id: result.insertId,
              nombre,
              email,
              rol: "cliente",
            },
          });
        },
      );
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
    (err, result) => {
      if (err) return res.json({ status: "fail" });

      if (req.body.estado === "Finalizado") {
        // Notifica al cliente/asesor en la sala del ticket
        io.to("ticket_" + req.params.id).emit("ticketFinalizado", {
          ticket_id: req.params.id,
        });
        // Notifica al admin en tiempo real
        io.to("admin_room").emit("ticketFinalizadoAdmin", {
          ticket_id: req.params.id,
          estado: "Finalizado",
        });
      }

      res.json({ status: "ok" });
    },
  );
});

// ===== TICKETS FINALIZADOS (ADMIN) =====
app.get("/tickets/finalizados", (req, res) => {
  db.query(
    `SELECT t.id, t.nombre, t.email,
    COALESCE(u.telefono,'No registrado') AS telefono,
    t.categoria, t.descripcion, t.estado,
    COALESCE(t.escala,'Seleccionar') AS escala, t.fecha
    FROM tickets t
    LEFT JOIN usuarios u ON t.email = u.email
    WHERE t.estado = 'Finalizado'
    ORDER BY t.id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json([]);
      res.json(rows);
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

// ===== MERCADOPAGO =====
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const PLANES = {
  basico:   { nombre: "Plan Básico TecniRed",   precio: 30000,  descripcion: "Soporte remoto básico, 1 equipo, diagnóstico mensual" },
  estandar: { nombre: "Plan Estándar TecniRed", precio: 60000,  descripcion: "Soporte ilimitado, hasta 3 equipos, seguridad antivirus" },
  premium:  { nombre: "Plan Premium TecniRed",  precio: 100000, descripcion: "Soporte prioritario, equipos ilimitados, asesor dedicado" },
};

// Crear preferencia de pago
app.post("/pago/crear", async (req, res) => {
  const { plan, email } = req.body;
  const planInfo = PLANES[plan];
  if (!planInfo) return res.status(400).json({ status: "fail", message: "Plan no válido" });

  try {
    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: [{
          id: plan,
          title: planInfo.nombre,
          description: planInfo.descripcion,
          quantity: 1,
          currency_id: "COP",
          unit_price: planInfo.precio,
        }],
        payer: { email: email || undefined },
        back_urls: {
          success: `${process.env.APP_URL}/pago/exito`,
          failure: `${process.env.APP_URL}/pago/fallo`,
          pending: `${process.env.APP_URL}/pago/pendiente`,
        },
        auto_return: "approved",
        notification_url: `${process.env.APP_URL}/pago/webhook`,
        metadata: { plan, email: email || "" },
        statement_descriptor: "TECNIRED",
      },
    });

    res.json({
      status: "ok",
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });
  } catch (err) {
    console.error("MP error:", err);
    res.status(500).json({ status: "fail", message: "No se pudo crear el pago" });
  }
});

// Webhook — MercadoPago notifica aquí cuando hay un pago
app.post("/pago/webhook", async (req, res) => {
  const { type, data } = req.query;

  // Verificar firma del webhook con la clave secreta
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

  if (type !== "payment") return res.sendStatus(200);

  try {
    const payment = new Payment(mpClient);
    const pago = await payment.get({ id: data.id });

    if (pago.status === "approved") {
      const { plan, email } = pago.metadata || {};
      if (plan && email) {
        db.query(
          `INSERT INTO pagos (email, plan, monto, mp_payment_id, estado, fecha)
           VALUES (?, ?, ?, ?, 'aprobado', NOW())
           ON DUPLICATE KEY UPDATE estado='aprobado', fecha=NOW()`,
          [email, plan, pago.transaction_amount, String(pago.id)],
          (err) => { if (err) console.error("Error guardando pago:", err.message); }
        );
        db.query(
          "UPDATE usuarios SET plan=? WHERE email=?",
          [plan, email],
          (err) => {
            if (err) console.error("Error actualizando plan:", err.message);
            else console.log(`✅ Plan ${plan} activado para ${email}`);
          }
        );
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err);
    res.sendStatus(500);
  }
});

// Páginas de retorno
app.get("/pago/exito",     (req, res) => res.sendFile(path.join(__dirname, "public/pago_exito.html")));
app.get("/pago/fallo",     (req, res) => res.sendFile(path.join(__dirname, "public/pago_fallo.html")));
app.get("/pago/pendiente", (req, res) => res.sendFile(path.join(__dirname, "public/pago_pendiente.html")));

// Crear tabla pagos si no existe
db.query(`
  CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    mp_payment_id VARCHAR(100) UNIQUE,
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha DATETIME DEFAULT NOW()
  )
`, (err) => {
  if (err) console.error("Error creando tabla pagos:", err.message);
  else console.log("✅ Tabla pagos lista");
});
