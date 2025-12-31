// pages/api/send-scan.js
import nodemailer from "nodemailer";
import fs from "fs";
import { promisify } from "util";
import formidable from "formidable";

const readFile = promisify(fs.readFile);

export const config = {
  api: {
    bodyParser: false, // obrigatório para usar formidable
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
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "TO_EMAIL"];
  const missing = required.filter((k) => !process.env[k] || process.env[k] === "");
  return missing;
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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // valida envs
  const missing = envMissing();
  if (missing.length) {
    console.error("SMTP envs faltando:", missing);
    return res.status(500).json({ error: "SMTP envs faltando", missing });
  }

  try {
    const { fields, files } = await parseForm(req);
    console.log("Form fields:", Object.keys(fields));
    console.log("Files keys:", Object.keys(files || {}));

    // Monta HTML do email
    const html = `
      <h2>Novo envio - Formulário de Escaneamento</h2>
      <ul>
        <li><strong>Cirurgião:</strong> ${escapeHtml(fields.cirurgia_nome || "")} ${escapeHtml(fields.cirurgia_sobrenome || "")}</li>
        <li><strong>Paciente:</strong> ${escapeHtml(fields.paciente_nome || "")} ${escapeHtml(fields.paciente_sobrenome || "")}</li>
        <li><strong>Tipo:</strong> ${escapeHtml(fields.tipo || "")}</li>
        <li><strong>Conexão:</strong> ${escapeHtml(fields.conexao || "")}</li>
        <li><strong>Implante / Obs:</strong> ${escapeHtml(fields.implante_info || "")}</li>
        <li><strong>Link do escaneamento:</strong> ${escapeHtml(fields.link || "")}</li>
        <li><strong>Comentários:</strong> ${escapeHtml(fields.comentarios || "")}</li>
      </ul>
    `;

    // cria transporter com envs
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 0);
    let smtpSecure = process.env.SMTP_SECURE;
    // se SMTP_SECURE não setado, deduz a partir da porta (465 -> true)
    if (typeof smtpSecure === "undefined" || smtpSecure === "") {
      smtpSecure = smtpPort === 465;
    } else {
      smtpSecure = smtpSecure === "true" || smtpSecure === "1" || smtpSecure === true;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Prepara anexos a partir de files (formidable)
    const attachments = [];
    if (files && Object.keys(files).length > 0) {
      for (const key of Object.keys(files)) {
        const fileOrArr = files[key];
        const items = Array.isArray(fileOrArr) ? fileOrArr : [fileOrArr];
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
      subject: `Novo formulário de escaneamento - ${fields.paciente_nome || ""}`,
      text: (html.replace(/<[^>]+>/g, "")).slice(0, 2000),
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
    console.log("Enviado:", info && info.messageId);

    return res.status(200).json({ ok: true, messageId: info && info.messageId });
  } catch (err) {
    console.error("Erro no send-scan:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "Erro ao processar envio", detail: String(err) });
  }
}
