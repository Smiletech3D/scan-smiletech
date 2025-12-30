import nodemailer from "nodemailer";
import fs from "fs";
import { promisify } from "util";
import formidable from "formidable";

const readFile = promisify(fs.readFile);

export const config = {
  api: {
    bodyParser: false, // obrigatório p/ formidable
  },
};

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

  // valida ENVs
  const missing = envMissing();
  if (missing.length) {
    console.error("SMTP envs faltando:", missing);
    return res.status(500).json({ error: "SMTP envs faltando", missing });
  }

  try {
    const { fields, files } = await parseForm(req);
    console.log("Form fields:", Object.keys(fields));
    console.log("Files:", Object.keys(files));

    // Monta o HTML do e-mail (ajuste conforme seu formulário)
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

    // Cria transporter
    const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || 0);
let smtpSecure = process.env.SMTP_SECURE;

if (typeof smtpSecure === "undefined" || smtpSecure === "") {
  smtpSecure = (smtpPort === 465); // default secure= true for 465
} else {
  smtpSecure = smtpSecure === "true" || smtpSecure === true;
}

console.log("SMTP config (no secrets):", {
  smtpHost,
  smtpPort,
  smtpSecure,
  smtpUser: process.env.SMTP_USER ? "set" : "MISSING",
});

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // optional: melhora compatibilidade STARTTLS
  tls: {
    // se Hostinger usa certificados confiáveis, não precisa true/false, mas em testes às vezes útil:
    rejectUnauthorized: false
  }
});

    // prepara attachments (se houver)
    const attachments = [];
    if (files && Object.keys(files).length > 0) {
      // formidable pode prover single file ou array dependendo do campo
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
      text: html.replace(/<[^>]*>/g, ""), // fallback
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

    const info = await transporter.sendMail(mailOptions);
    console.log("Enviado:", info.messageId);

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("Erro no send-scan:", err);
    return res.status(500).json({ error: "Erro ao processar envio", detail: String(err) });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
