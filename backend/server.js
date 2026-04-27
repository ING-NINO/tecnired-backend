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

// ===== CREAR TICKET CON VERIFICACIÓN DE LÍMITES =====
app.post("/tickets", async (req, res) => {
  const { nombre, email, categoria, descripcion } = req.body;

  // Verificar límites del plan
  const verificacion = await verificarLimitesPlan(email, "crear_ticket");

  if (!verificacion.permitido) {
    return res.status(403).json({
      status: "fail",
      message: verificacion.mensaje,
      ticketsUsados: verificacion.ticketsUsados,
      ticketsDisponibles: verificacion.ticketsDisponibles
    });
  }

  db.query(
    `INSERT INTO tickets 
    (nombre,email,categoria,descripcion,prioridad,estado,escala,fecha)
    VALUES (?,?,?,?, 'Pendiente','Nuevo','Seleccionar',NOW())`,
    [nombre, email, categoria, descripcion],
    (err) => {
      if (err) return res.status(500).json({ status: "fail" });
      res.json({
        status: "ok",
        plan: verificacion.plan,
        ticketsRestantes: verificacion.ticketsDisponibles - 1
      });
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
  gratis: {
    nombre: "Plan Gratis (Prueba 7 días)",
    precio: 0,
    descripcion: "1 ticket/mes, respuesta 72h, chat básico",
    limites: {
      tickets_mes: 1,
      tiempo_respuesta: "72 horas",
      adjuntos: false,
      escalamiento: false,
      soporte_telefono: false,
      videollamada: false,
      asesor_dedicado: false,
      reportes: false
    }
  },
  estandar: {
    nombre: "Plan Estándar TecniRed",
    precio: 2000, // Precio de prueba — cambiar a 60000 para producción
    descripcion: "5 tickets/mes, respuesta 24h, chat prioritario, escalamiento N1-N2",
    limites: {
      tickets_mes: 5,
      tiempo_respuesta: "24 horas",
      adjuntos: true,
      escalamiento: ["1", "2"],
      soporte_telefono: "horario_laboral",
      videollamada: false,
      asesor_dedicado: false,
      reportes: false
    }
  },
  premium: {
    nombre: "Plan Premium TecniRed",
    precio: 100000,
    descripcion: "Tickets ilimitados, respuesta 4h 24/7, asesor dedicado, escalamiento completo",
    limites: {
      tickets_mes: -1, // ilimitado
      tiempo_respuesta: "4 horas",
      adjuntos: true,
      escalamiento: ["1", "2", "3"],
      soporte_telefono: "24/7",
      videollamada: true,
      asesor_dedicado: true,
      reportes: true
    }
  }
};

// Middleware para verificar límites del plan
async function verificarLimitesPlan(email, accion) {
  return new Promise((resolve) => {
    db.query(
      "SELECT plan FROM usuarios WHERE email=?",
      [email],
      (err, rows) => {
        if (err || !rows.length) {
          return resolve({ permitido: false, mensaje: "Usuario no encontrado" });
        }

        const planUsuario = rows[0].plan || "gratis";
        const limites = PLANES[planUsuario]?.limites;

        if (!limites) {
          return resolve({ permitido: false, mensaje: "Plan no válido" });
        }

        // Verificar límite de tickets por mes
        if (accion === "crear_ticket") {
          if (limites.tickets_mes === -1) {
            return resolve({ permitido: true, plan: planUsuario, limites });
          }

          const inicioMes = new Date();
          inicioMes.setDate(1);
          inicioMes.setHours(0, 0, 0, 0);

          db.query(
            "SELECT COUNT(*) as total FROM tickets WHERE email=? AND fecha >= ?",
            [email, inicioMes],
            (err, count) => {
              if (err) {
                return resolve({ permitido: false, mensaje: "Error verificando límites" });
              }

              const ticketsUsados = count[0].total;
              if (ticketsUsados >= limites.tickets_mes) {
                return resolve({
                  permitido: false,
                  mensaje: `Has alcanzado el límite de ${limites.tickets_mes} tickets por mes. Actualiza tu plan para continuar.`,
                  ticketsUsados,
                  ticketsDisponibles: limites.tickets_mes
                });
              }

              resolve({
                permitido: true,
                plan: planUsuario,
                limites,
                ticketsUsados,
                ticketsDisponibles: limites.tickets_mes - ticketsUsados
              });
            }
          );
        } else {
          resolve({ permitido: true, plan: planUsuario, limites });
        }
      }
    );
  });
}

// Endpoint para obtener información del plan y límites
app.get("/usuario/plan/:email", (req, res) => {
  db.query(
    "SELECT plan FROM usuarios WHERE email=?",
    [req.params.email],
    (err, rows) => {
      if (err || !rows.length) {
        return res.json({ plan: "gratis", limites: PLANES.gratis.limites });
      }

      const planUsuario = rows[0].plan || "gratis";
      const planInfo = PLANES[planUsuario];

      // Contar tickets del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      db.query(
        "SELECT COUNT(*) as total FROM tickets WHERE email=? AND fecha >= ?",
        [req.params.email, inicioMes],
        (err, count) => {
          const ticketsUsados = err ? 0 : count[0].total;
          const ticketsDisponibles = planInfo.limites.tickets_mes === -1
            ? "ilimitados"
            : planInfo.limites.tickets_mes - ticketsUsados;

          res.json({
            plan: planUsuario,
            nombre: planInfo.nombre,
            limites: planInfo.limites,
            ticketsUsados,
            ticketsDisponibles
          });
        }
      );
    }
  );
});

// Endpoint para obtener todos los planes disponibles
app.get("/planes", (req, res) => {
  const planesPublicos = Object.keys(PLANES).map(key => ({
    id: key,
    nombre: PLANES[key].nombre,
    precio: PLANES[key].precio,
    descripcion: PLANES[key].descripcion,
    limites: PLANES[key].limites
  }));
  res.json(planesPublicos);
});

// Crear preferencia de pago
app.post("/pago/crear", async (req, res) => {
  const { plan, email } = req.body;
  const planInfo = PLANES[plan];
  
  if (!planInfo) {
    return res.status(400).json({ status: "fail", message: "Plan no válido" });
  }

  if (planInfo.precio === 0) {
    return res.status(400).json({ status: "fail", message: "El plan gratis no requiere pago" });
  }

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

// Agregar columna plan a usuarios si no existe
db.query("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'gratis'", (err) => {
  if (err && !err.message.includes("Duplicate")) console.error("plan column:", err.message);
  else console.log("✅ Columna plan lista");
});

// Crear tabla de feedback si no existe
db.query(`
  CREATE TABLE IF NOT EXISTS feedback (
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
  )
`, (err) => {
  if (err) console.error("Error creando tabla feedback:", err.message);
  else console.log("✅ Tabla feedback lista");
});

// Endpoint para recibir feedback
app.post("/feedback", (req, res) => {
  const { nombre, email, tipo, rating, mensaje } = req.body;

  if (!nombre || !email || !tipo || !rating || !mensaje) {
    return res.status(400).json({ status: "fail", message: "Todos los campos son obligatorios" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ status: "fail", message: "La calificación debe estar entre 1 y 5" });
  }

  const tiposValidos = ["comentario", "sugerencia", "problema", "felicitacion"];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ status: "fail", message: "Tipo de feedback no válido" });
  }

  db.query(
    "INSERT INTO feedback (nombre, email, tipo, rating, mensaje, fecha) VALUES (?, ?, ?, ?, ?, NOW())",
    [nombre, email, tipo, rating, mensaje],
    (err, result) => {
      if (err) {
        console.error("Error guardando feedback:", err);
        return res.status(500).json({ status: "fail", message: "Error al guardar el feedback" });
      }

      console.log(`✅ Nuevo feedback recibido: ${tipo} - ${rating}⭐ de ${nombre}`);
      res.json({ status: "ok", message: "Feedback guardado correctamente", id: result.insertId });
    }
  );
});

// Endpoint para obtener estadísticas de feedback (admin)
app.get("/feedback/stats", (req, res) => {
  db.query(`
    SELECT 
      COUNT(*) as total,
      AVG(rating) as promedio_rating,
      SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positivos,
      SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as negativos,
      COUNT(DISTINCT email) as usuarios_unicos
    FROM feedback
  `, (err, stats) => {
    if (err) return res.status(500).json({ status: "fail" });
    
    db.query(`
      SELECT tipo, COUNT(*) as cantidad
      FROM feedback
      GROUP BY tipo
    `, (err, porTipo) => {
      if (err) return res.status(500).json({ status: "fail" });
      
      res.json({
        status: "ok",
        stats: stats[0],
        porTipo: porTipo
      });
    });
  });
});

// Endpoint para listar todo el feedback (admin)
app.get("/feedback", (req, res) => {
  const { tipo, rating, limit } = req.query;
  
  let sql = "SELECT * FROM feedback WHERE 1=1";
  const params = [];

  if (tipo) {
    sql += " AND tipo = ?";
    params.push(tipo);
  }

  if (rating) {
    sql += " AND rating = ?";
    params.push(parseInt(rating));
  }

  sql += " ORDER BY fecha DESC";

  if (limit) {
    sql += " LIMIT ?";
    params.push(parseInt(limit));
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ status: "fail" });
    res.json({ status: "ok", feedback: rows });
  });
});

// Endpoint para obtener el plan del usuario
app.get("/usuario/plan/:email", (req, res) => {
  db.query(
    "SELECT plan FROM usuarios WHERE email=?",
    [req.params.email],
    (err, rows) => {
      if (err || !rows.length) return res.json({ plan: "gratis" });
      res.json({ plan: rows[0].plan || "gratis" });
    }
  );
});

// Crear tabla de pagos si no existe
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
