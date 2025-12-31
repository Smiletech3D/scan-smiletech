import nodemailer from "nodemailer";
import fs from "fs";
import { promisify } from "util";
import formidable from "formidable";

const readFile = promisify(fs.readFile);

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      multiples: true,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requiredEnvs = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "TO_EMAIL",
  ];

  const missing = requiredEnvs.filter((e) => !process.env[e]);
  if (missing.length) {
    console.error("SMTP envs faltando:", missing);
    return res.status(500).json({
      error: "SMTP envs faltando",
      missing,
    });
  }

  try {
    const { fields, files } = await parseForm(req);

    // 🔥 MAPEAMENTO CORRETO DOS CAMPOS DO FORMULÁRIO
    const cirurgiaoNome = `${fields.cirurgiao_nome || ""} ${fields.cirurgiao_sobrenome || ""}`.trim();
    const pacienteNome = `${fields.paciente_nome || ""} ${fields.paciente_sobrenome || ""}`.trim();

    const html = `
      <h2>Novo envio - Formulário de Escaneamento</h2>
      <ul>
        <li><strong>Cirurgião:</strong> ${escapeHtml(cirurgiaoNome)}</li>
        <li><strong>Paciente:</strong> ${escapeHtml(pacienteNome)}</li>
        <li><strong>Tipo de escaneamento:</strong> ${escapeHtml(fields.tipo_escaneamento)}</li>
        <li><strong>Conexão implante/pilar:</strong> ${escapeHtml(fields.conexao_implante)}</li>
        <li><strong>Implante / Observações:</strong> ${escapeHtml(fields.implante_info)}</li>
        <li><strong>Comentários:</strong> ${escapeHtml(fields.comentarios)}</li>
        <li><strong>Link do escaneamento:</strong> ${escapeHtml(fields.link_escaneamento)}</li>
      </ul>
    `;

    const smtpPort = Number(process.env.SMTP_PORT);
    const smtpSecure =
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE === "true"
        : smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 📎 Anexos
    const attachments = [];
    for (const key of Object.keys(files || {})) {
      const fileOrArray = files[key];
      const arr = Array.isArray(fileOrArray) ? fileOrArray : [fileOrArray];

      for (const f of arr) {
        if (!f?.filepath) continue;
        attachments.push({
          filename: f.originalFilename || "arquivo",
          content: await readFile(f.filepath),
          contentType: f.mimetype,
        });
      }
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.TO_EMAIL,
      subject: `Novo formulário de escaneamento - ${pacienteNome}`,
      html,
      text: html.replace(/<[^>]+>/g, ""),
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("Erro no envio:", err);
    return res.status(500).json({
      error: "Erro ao enviar email",
      detail: String(err),
    });
  }
}
