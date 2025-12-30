// pages/api/send-scan.js
import fs from "fs";
import nodemailer from "nodemailer";
import formidable from "formidable";

// Disable Next.js body parser for this route so formidable can parse multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = formidable({
      multiples: true,
      maxFileSize: 20 * 1024 * 1024, // 20 MB limit total per file (ajuste se quiser)
      keepExtensions: true,
      uploadDir: "/tmp", // funciona no Vercel durante execução
    });

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fields, files } = await parseForm(req);

    // Monta HTML do email com dados do formulário
    const html = `
      <h2>Novo envio - Formulário de Escaneamento</h2>
      <ul>
        <li><strong>Cirurgião:</strong> ${escapeHtml(fields.cirurgiao || "")}</li>
        <li><strong>Paciente:</strong> ${escapeHtml(fields.paciente || "")}</li>
        <li><strong>Tipo:</strong> ${escapeHtml(fields.tipo || "")}</li>
        <li><strong>Implante / Observações:</strong> ${escapeHtml(fields.implante || "")}</li>
        <li><strong>Link do escaneamento:</strong> ${escapeHtml(fields.link || "")}</li>
      </ul>
    `;

    // Configura o transporter usando variáveis de ambiente
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Monta anexos a partir de files (formidable)
    const attachments = [];
    if (files && Object.keys(files).length > 0) {
      // files pode ter único arquivo ou array
      for (const key of Object.keys(files)) {
        const item = files[key];
        if (Array.isArray(item)) {
          for (const f of item) {
            attachments.push({
              filename: f.originalFilename || f.newFilename || "file",
              path: f.filepath || f.path,
            });
          }
        } else {
          attachments.push({
            filename: item.originalFilename || item.newFilename || "file",
            path: item.filepath || item.path,
          });
        }
      }
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.TO_EMAIL,
      subject: `Novo Scan - ${fields.paciente || "Paciente"}`,
      html,
      attachments,
    };

    // Send mail
    const info = await transporter.sendMail(mailOptions);

    // Opcional: limpar arquivos temporários
    for (const a of attachments) {
      try {
        fs.unlinkSync(a.path);
      } catch (e) {
        // ignore
      }
    }

    console.log("Email enviado:", info.messageId);
    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("Erro em send-scan:", err);
    // se for erro de conexão SMTP, env var incorreta é provável
    return res.status(500).json({ error: String(err) });
  }
}

// função auxiliar para escapar HTML simples
function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
