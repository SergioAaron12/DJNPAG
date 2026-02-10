require("dotenv").config();

const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const { WebpayPlus, Options, Environment } = require("transbank-sdk");
const fs = require("fs/promises");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const destinatario = process.env.DEST_EMAIL || "grupo.movirec2023@gmail.com";
const adminToken = process.env.ADMIN_TOKEN;
const dataDir = path.join(__dirname, "data");
const comprasFile = path.join(dataDir, "compras.json");

const asegurarArchivoCompras = async () => {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(comprasFile);
  } catch {
    await fs.writeFile(comprasFile, "[]", "utf8");
  }
};

const guardarCompraEnArchivo = async (compra) => {
  await asegurarArchivoCompras();
  const contenido = await fs.readFile(comprasFile, "utf8");
  const compras = JSON.parse(contenido || "[]");
  compras.unshift(compra);
  await fs.writeFile(comprasFile, JSON.stringify(compras, null, 2), "utf8");
};

const WEBPAY_ENV = process.env.WEBPAY_ENV || "integration";
const WEBPAY_COMMERCE_CODE =
  process.env.WEBPAY_COMMERCE_CODE || "597055555532";
const WEBPAY_API_KEY = process.env.WEBPAY_API_KEY || "123456789";

const webpayOptions = new Options(
  WEBPAY_COMMERCE_CODE,
  WEBPAY_API_KEY,
  WEBPAY_ENV === "production" ? Environment.Production : Environment.Integration
);
const webpayTx = new WebpayPlus.Transaction(webpayOptions);

const formatCLP = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

app.post("/api/compra", async (req, res) => {
  try {
    const compra = req.body;
    if (!destinatario) {
      return res
        .status(500)
        .json({ ok: false, message: "DEST_EMAIL no configurado" });
    }

    await guardarCompraEnArchivo(compra);

    const html = `
      <h2>Nueva compra DJN</h2>
      <p><strong>Fecha:</strong> ${new Date(compra.fecha).toLocaleString(
        "es-ES"
      )}</p>
      <p><strong>Cliente:</strong> ${compra.nombre}</p>
      <p><strong>Correo:</strong> ${compra.correo}</p>
      <p><strong>Teléfono:</strong> ${compra.telefono}</p>
      <p><strong>Dirección:</strong> ${compra.direccion}</p>
      <p><strong>Producto:</strong> ${compra.producto}</p>
      <p><strong>Cantidad:</strong> ${compra.cantidad}</p>
        <p><strong>Precio de la jaula:</strong> ${formatCLP(compra.precioUnitario)}</p>
        <p><strong>Total:</strong> ${formatCLP(compra.total)}</p>
      <p><strong>Método de pago:</strong> ${compra.metodo}</p>
    `;

    await transporter.sendMail({
      from: `DJN <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: destinatario,
      subject: "Nueva compra - DJN",
      html,
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error enviando correo" });
  }
});

app.post("/api/contacto", async (req, res) => {
  try {
    const { nombre, correo, telefono, mensaje } = req.body || {};
    if (!destinatario) {
      return res
        .status(500)
        .json({ ok: false, message: "DEST_EMAIL no configurado" });
    }

    if (!nombre || !correo || !telefono || !mensaje) {
      return res.status(400).json({ ok: false, message: "Datos inválidos" });
    }

    if (mensaje.length < 10 || mensaje.length > 500) {
      return res
        .status(400)
        .json({ ok: false, message: "Mensaje fuera de rango" });
    }

    const html = `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${mensaje}</p>
      <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
    `;

    await transporter.sendMail({
      from: `DJN <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: destinatario,
      subject: "Contacto - DJN",
      html,
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error enviando mensaje" });
  }
});

app.get("/api/admin/compras", async (req, res) => {
  try {
    if (!adminToken || req.headers["x-admin-token"] !== adminToken) {
      return res.status(401).json({ ok: false, message: "No autorizado" });
    }

    await asegurarArchivoCompras();
    const contenido = await fs.readFile(comprasFile, "utf8");
    const compras = JSON.parse(contenido || "[]");
    res.json({ ok: true, compras });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error leyendo compras" });
  }
});

app.post("/api/webpay/crear", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ ok: false, message: "Monto inválido" });
    }

    const buyOrder = `DJN-${Date.now()}`;
    const sessionId = `SESSION-${Date.now()}`;
    const returnUrl =
      process.env.WEBPAY_RETURN_URL ||
      `http://localhost:${PORT}/webpay/retorno`;

    const response = await webpayTx.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );

    res.json({ url: response.url, token: response.token });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error creando transacción" });
  }
});

app.post("/webpay/retorno", async (req, res) => {
  try {
    const token = req.body.token_ws || req.query.token_ws;
    if (!token) {
      return res.status(400).send("Token Webpay no encontrado");
    }

    const result = await webpayTx.commit(token);
    const status = result.status || "DESCONOCIDO";
    const amount = result.amount || 0;
    const order = result.buy_order || "-";

    if (destinatario && status === "AUTHORIZED") {
      const html = `
        <h2>Pago confirmado - DJN</h2>
        <p><strong>Estado:</strong> ${status}</p>
        <p><strong>Orden:</strong> ${order}</p>
        <p><strong>Monto:</strong> ${formatCLP(amount)}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-ES")}</p>
      `;

      await transporter.sendMail({
        from: `DJN <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: destinatario,
        subject: "Pago confirmado - DJN",
        html,
      });
    }

    res.send(`
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Resultado Webpay</title>
          <style>
            body { font-family: Arial, sans-serif; background: #0b0d10; color: #f5f7fb; display: grid; place-items: center; min-height: 100vh; margin: 0; }
            .card { background: #14181f; border: 1px solid #1f2530; padding: 24px; border-radius: 16px; width: min(520px, 92%); }
            a { color: #d4af37; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Resultado del pago</h2>
            <p><strong>Estado:</strong> ${status}</p>
            <p><strong>Orden:</strong> ${order}</p>
            <p><strong>Monto:</strong> ${formatCLP(amount)}</p>
            <p><a href="/index.html">Volver al sitio</a></p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Error confirmando el pago");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor DJN listo en http://localhost:${PORT}`);
});
