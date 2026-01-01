// pages/api/send-scan.js
import nodemailer from "nodemailer";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

function parseForm(req) {
  const form = new formidable.IncomingForm({ multiples: true, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

function makeArray(value) {
  if (!value && value !== 0) return [];
  if (Array.isArray(value)) return value;
  // formidable returns a string when single selection
  return [value];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const requiredEnvs = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "TO_EMAIL",
  ];
  const missing = requiredEnvs.filter((k) => !process.env[k]);
  if (missing.length) {
    return res.status(500).json({ error: `SMTP envs faltando: ${missing.join(", ")}` });
  }

  try {
    const { fields, files } = await parseForm(req);

    // Normalize multi-values
    const dentes = makeArray(fields.dentes);
    const vita = makeArray(fields.vita);
    const material = fields.material || "";
    const attachments = [];

    // handle file attachments (formidable returns file objects)
    const fileObjs = Object.values(files || {});
    // fileObjs can be arrays or single; flatten
    fileObjs.flat().forEach((f) => {
      if (!f) return;
      const path = f.filepath || f.path; // formidable versions differ
      if (fs.existsSync(path)) {
        attachments.push({
          filename: f.originalFilename || f.newFilename || f.name || "file",
          content: fs.readFileSync(path),
        });
      }
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Build HTML with all fields including novos
    const html = `
      <h2>Novo envio - Formulário de Escaneamento</h2>
      <ul>
        <li><b>Cirurgião:</b> ${fields.cirurgia_nome || ""} ${fields.cirurgia_sobrenome || ""}</li>
        <li><b>Paciente:</b> ${fields.paciente_nome || ""} ${fields.paciente_sobrenome || ""}</li>
        <li><b>Tipo:</b> ${fields.tipo || ""}</li>
        <li><b>Conexão:</b> ${fields.conexao || ""}</li>
        <li><b>Implante / Obs:</b> ${fields.implante_info || ""}</li>
        <li><b>Dentes selecionados:</b> ${dentes.length ? dentes.join(", ") : "—"}</li>
        <li><b>Material:</b> ${material || "—"}</li>
        <li><b>Escala VITA:</b> ${vita.length ? vita.join(", ") : "—"}</li>
        <li><b>Comentários:</b> ${fields.comentarios || ""}</li>
        <li><b>Link do escaneamento:</b> ${fields.link || ""}</li>
      </ul>
      <p>Anexos enviados: ${attachments.length}</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.TO_EMAIL,
      subject: `Novo formulário de escaneamento - ${fields.paciente_nome || "Paciente"}`,
      html,
      attachments,
    });

    return res.status(200).json({ ok: true, attachmentsCount: attachments.length });
  } catch (err) {
    console.error("send-scan error:", err);
    return res.status(500).json({ error: "Erro ao enviar email" });
  }
}
