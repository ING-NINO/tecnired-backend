// Tutorial interactivo para usuarios nuevos
class Tutorial {
  constructor() {
    this.pasoActual = 0;
    this.pasos = [
      {
        titulo: "¡Bienvenido a TecniRed! 👋",
        mensaje: "Te guiaremos en un recorrido rápido para que conozcas todas las funcionalidades de la plataforma.",
        elemento: null,
        posicion: "center"
      },
      {
        titulo: "Tu Plan Actual 📦",
        mensaje: "Aquí puedes ver tu plan actual y cuántos tickets tienes disponibles este mes. Puedes actualizar tu plan en cualquier momento.",
        elemento: ".plan-info, .user-info, [class*='plan']",
        posicion: "bottom"
      },
      {
        titulo: "Crear Tickets 🎫",
        mensaje: "Haz clic aquí para crear un nuevo ticket de soporte. Describe tu problema y nuestro equipo te ayudará.",
        elemento: "button[onclick*='crearTicket'], .btn-crear, [class*='crear']",
        posicion: "bottom"
      },
      {
        titulo: "Tus Tickets 📋",
        mensaje: "Aquí verás todos tus tickets. Puedes hacer clic en cualquiera para ver el chat y seguimiento.",
        elemento: "#ticketsTable, .tickets-list, table",
        posicion: "top"
      },
      {
        titulo: "Chat en Tiempo Real 💬",
        mensaje: "Cuando abras un ticket, podrás chatear en tiempo real con nuestros asesores. ¡Recibirás respuestas rápidas!",
        elemento: ".chat-container, #chatContainer",
        posicion: "left"
      },
      {
        titulo: "Actualizar Plan 🚀",
        mensaje: "¿Necesitas más tickets o soporte prioritario? Haz clic aquí para ver nuestros planes y actualizar.",
        elemento: "a[href*='planes'], .btn-planes, [class*='upgrade']",
        posicion: "bottom"
      },
      {
        titulo: "¡Listo para Empezar! ✨",
        mensaje: "Ya conoces lo básico. Si tienes dudas, nuestro equipo está aquí para ayudarte. ¡Crea tu primer ticket!",
        elemento: null,
        posicion: "center"
      }
    ];
    this.overlay = null;
    this.modal = null;
  }

  iniciar() {
    // Verificar si el usuario ya vio el tutorial
    const tutorialVisto = localStorage.getItem("tutorial_visto");
    if (tutorialVisto === "true") {
      return;
    }

    // Esperar 1 segundo para que la página cargue
    setTimeout(() => {
      this.crearOverlay();
      this.mostrarPaso(0);
    }, 1000);
  }

  crearOverlay() {
    // Crear overlay oscuro
    this.overlay = document.createElement("div");
    this.overlay.id = "tutorial-overlay";
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(this.overlay);

    // Crear modal del tutorial
    this.modal = document.createElement("div");
    this.modal.id = "tutorial-modal";
    this.modal.style.cssText = `
      position: fixed;
      background: white;
      border-radius: 15px;
      padding: 30px;
      max-width: 400px;
      z-index: 9999;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(this.modal);
  }

  mostrarPaso(index) {
    if (index >= this.pasos.length) {
      this.finalizar();
      return;
    }

    this.pasoActual = index;
    const paso = this.pasos[index];

    // Limpiar highlight anterior
    document.querySelectorAll(".tutorial-highlight").forEach(el => {
      el.classList.remove("tutorial-highlight");
      el.style.position = "";
      el.style.zIndex = "";
    });

    // Encontrar y destacar el elemento
    let elemento = null;
    if (paso.elemento) {
      const selectores = paso.elemento.split(", ");
      for (const selector of selectores) {
        elemento = document.querySelector(selector);
        if (elemento) break;
      }

      if (elemento) {
        elemento.classList.add("tutorial-highlight");
        elemento.style.position = "relative";
        elemento.style.zIndex = "10000";
        
        // Agregar estilos de highlight
        if (!document.getElementById("tutorial-styles")) {
          const style = document.createElement("style");
          style.id = "tutorial-styles";
          style.textContent = `
            .tutorial-highlight {
              box-shadow: 0 0 0 4px #667eea, 0 0 0 8px rgba(102, 126, 234, 0.3) !important;
              animation: tutorial-pulse 2s infinite;
            }
            @keyframes tutorial-pulse {
              0%, 100% { box-shadow: 0 0 0 4px #667eea, 0 0 0 8px rgba(102, 126, 234, 0.3); }
              50% { box-shadow: 0 0 0 4px #667eea, 0 0 0 12px rgba(102, 126, 234, 0.5); }
            }
          `;
          document.head.appendChild(style);
        }
      }
    }

    // Posicionar modal
    this.posicionarModal(elemento, paso.posicion);

    // Actualizar contenido del modal
    this.modal.innerHTML = `
      <div style="text-align: center;">
        <h2 style="color: #333; margin-bottom: 15px; font-size: 1.5rem;">
          ${paso.titulo}
        </h2>
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px; font-size: 1.1rem;">
          ${paso.mensaje}
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #999; font-size: 0.9rem;">
            Paso ${index + 1} de ${this.pasos.length}
          </span>
          <div>
            ${index > 0 ? `
              <button onclick="tutorial.anterior()" style="
                background: #e0e0e0;
                color: #666;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                margin-right: 10px;
                font-weight: bold;
              ">
                Anterior
              </button>
            ` : ''}
            ${index < this.pasos.length - 1 ? `
              <button onclick="tutorial.siguiente()" style="
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
              ">
                Siguiente
              </button>
            ` : `
              <button onclick="tutorial.finalizar()" style="
                background: linear-gradient(135deg, #4caf50, #66bb6a);
                color: white;
                border: none;
                padding: 10px 25px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
              ">
                ¡Entendido!
              </button>
            `}
          </div>
        </div>
        <button onclick="tutorial.saltar()" style="
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          margin-top: 15px;
          font-size: 0.9rem;
          text-decoration: underline;
        ">
          Saltar tutorial
        </button>
      </div>
    `;

    // Scroll al elemento si existe
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  posicionarModal(elemento, posicion) {
    if (!elemento || posicion === "center") {
      // Centrar modal
      this.modal.style.top = "50%";
      this.modal.style.left = "50%";
      this.modal.style.transform = "translate(-50%, -50%)";
      return;
    }

    const rect = elemento.getBoundingClientRect();
    const modalWidth = 400;
    const modalHeight = 250;
    const gap = 20;

    switch (posicion) {
      case "top":
        this.modal.style.top = `${rect.top - modalHeight - gap}px`;
        this.modal.style.left = `${rect.left + rect.width / 2}px`;
        this.modal.style.transform = "translateX(-50%)";
        break;
      case "bottom":
        this.modal.style.top = `${rect.bottom + gap}px`;
        this.modal.style.left = `${rect.left + rect.width / 2}px`;
        this.modal.style.transform = "translateX(-50%)";
        break;
      case "left":
        this.modal.style.top = `${rect.top + rect.height / 2}px`;
        this.modal.style.left = `${rect.left - modalWidth - gap}px`;
        this.modal.style.transform = "translateY(-50%)";
        break;
      case "right":
        this.modal.style.top = `${rect.top + rect.height / 2}px`;
        this.modal.style.left = `${rect.right + gap}px`;
        this.modal.style.transform = "translateY(-50%)";
        break;
    }

    // Ajustar si se sale de la pantalla
    const modalRect = this.modal.getBoundingClientRect();
    if (modalRect.top < 10) {
      this.modal.style.top = "10px";
      this.modal.style.transform = this.modal.style.transform.replace("translateY(-50%)", "");
    }
    if (modalRect.bottom > window.innerHeight - 10) {
      this.modal.style.top = `${window.innerHeight - modalHeight - 10}px`;
      this.modal.style.transform = this.modal.style.transform.replace("translateY(-50%)", "");
    }
  }

  siguiente() {
    this.mostrarPaso(this.pasoActual + 1);
  }

  anterior() {
    this.mostrarPaso(this.pasoActual - 1);
  }

  saltar() {
    if (confirm("¿Estás seguro de que quieres saltar el tutorial? Podrás verlo de nuevo limpiando el almacenamiento del navegador.")) {
      this.finalizar();
    }
  }

  finalizar() {
    // Marcar tutorial como visto
    localStorage.setItem("tutorial_visto", "true");

    // Animar salida
    if (this.overlay) {
      this.overlay.style.opacity = "0";
      setTimeout(() => this.overlay.remove(), 300);
    }
    if (this.modal) {
      this.modal.style.opacity = "0";
      this.modal.style.transform += " scale(0.9)";
      setTimeout(() => this.modal.remove(), 300);
    }

    // Limpiar highlights
    document.querySelectorAll(".tutorial-highlight").forEach(el => {
      el.classList.remove("tutorial-highlight");
      el.style.position = "";
      el.style.zIndex = "";
    });

    // Remover estilos
    const styles = document.getElementById("tutorial-styles");
    if (styles) styles.remove();
  }

  reiniciar() {
    localStorage.removeItem("tutorial_visto");
    location.reload();
  }
}

// Crear instancia global
const tutorial = new Tutorial();

// Auto-iniciar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => tutorial.iniciar());
} else {
  tutorial.iniciar();
}
