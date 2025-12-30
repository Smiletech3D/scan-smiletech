import nodemailer from "nodemailer";
import fs from "fs";
import { promisify } from "util";
import formidable from "formidable";

const readFile = promisify(fs.readFile);

// Next.js: desativa o body parser para permitir formidable
export const config = {
  api: {
    bodyParser: false,
  },
};

/*
ENV VARS (defina no Vercel / .env.local - NUNCA comite senhas):
SMTP_HOST
SMTP_PORT
SMTP_SECURE   (string "true" or "false", optional; fallback based on port)
SMTP_USER
SMTP_PASS
SMTP_FROM
TO_EMAIL
*/

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ multiples: true, keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

function envMissing() {
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "TO_EMAIL",
  ];
  const missing = required.filter((k) => !process.env[k]);
  return missing;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // valida envs
  const missing = envMissing();
  if (missing.length) {
    console.error("SMTP envs faltando:", missing);
    return res.status(500).json({ error: "SMTP envs faltando", missing });
  }

  try {
    const { fields, files } = await parseForm(req);
    console.log("Form fields:", Object.keys(fields));
    console.log("Files:", Object.keys(files));

    // monta HTML do email
    const html = `
      <h2>Novo envio - Formulário de Escaneamento</h2>
      <ul>
        <li><strong>Cirurgião:</strong> ${escapeHtml(fields.cirurgia || "")}</li>
        <li><strong>Paciente:</strong> ${escapeHtml(fields.paciente || "")}</li>
        <li><strong>Tipo:</strong> ${escapeHtml(fields.tipo || "")}</li>
        <li><strong>Implante / Obs:</strong> ${escapeHtml(fields.implante || "")}</li>
        <li><strong>Link do escaneamento:</strong> ${escapeHtml(fields.link || "")}</li>
      </ul>
    `;

    // cria transporter - com logs e parsing de envs
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 0);

    let smtpSecure = process.env.SMTP_SECURE;
    if (smtpSecure === "true" || smtpSecure === "1" || smtpSecure === true) smtpSecure = true;
    else if (smtpSecure === "false" || smtpSecure === "0" || smtpSecure === false) smtpSecure = false;
    else smtpSecure = smtpPort === 465; // fallback: porta 465 => secure true

    console.log("SMTP config:", {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      userSet: !!process.env.SMTP_USER,
    });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // opcional: verificar conexão (rápido). Se preferir comente esta verificação.
    try {
      await transporter.verify();
      console.log("SMTP verified OK");
    } catch (verErr) {
      console.warn("SMTP verify warning/error:", String(verErr).slice(0, 200));
      // não retorna aqui porque há providers que não permitem verify; seguimos pra tentar enviar
    }

    // prepara attachments
    const attachments = [];
    if (files && Object.keys(files).length > 0) {
      // formidable pode fornecer um único arquivo ou array
      for (const key of Object.keys(files)) {
        const fileOrArray = files[key];
        const items = Array.isArray(fileOrArray) ? fileOrArray : [fileOrArray];
        for (const f of items) {
          if (!f || !f.filepath) continue;
          const content = await readFile(f.filepath);
          attachments.push({
            filename: f.originalFilename || f.newFilename || "attachment",
            content,
            contentType: f.mimetype || undefined,
          });
        }
      }
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.TO_EMAIL,
      subject: `Novo formulário de escaneamento - ${fields.paciente || ""}`,
      text: stripTags(html).slice(0, 1000), // fallback texto
      html,
      attachments,
    };

    console.log("Enviando e-mail com opções:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      attachmentsCount: attachments.length,
      smtpHost,
      smtpPort,
      smtpSecure,
    });

    // envia
    const info = await transporter.sendMail(mailOptions);
    console.log("Enviado:", info && info.messageId ? info.messageId : info);

    return res.status(200).json({ ok: true, messageId: info.messageId || null });
  } catch (err) {
    console.error("Erro no send-scan:", err);
    return res.status(500).json({ error: "Erro ao processar envio", detail: String(err) });
  }
}

/* helpers */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripTags(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, "");
}

