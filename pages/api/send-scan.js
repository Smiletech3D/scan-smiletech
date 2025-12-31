// pages/api/send-scan.js
import nodemailer from "nodemailer";
import fs from "fs";
import { promisify } from "util";
import formidable from "formidable";

const readFile = promisify(fs.readFile);

export const config = {
  api: {
    bodyParser: false, // necessário para uploads via formidable
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

  // valida envs
  const missing = envMissing();
  if (missing.length) {
    console.error("SMTP envs faltando:", missing);
    return res.status(500).json({ error: "SMTP envs faltando", missing });
  }

  try {
    const { fields, files } = await parseForm(req);

    // Log dos campos recebidos (útil pra debug — não imprime senhas)
    console.log("Form fields:", Object.keys(fields));
    console.log("Files keys:", Object.keys(files));

    // Campos textuais usuais
    const cirurgia_nome = fields.cirurgia_nome || "";
    const cirurgia_sobrenome = fields.cirurgia_sobrenome || "";
    const paciente_nome = fields.paciente_nome || "";
    const paciente_sobrenome = fields.paciente_sobrenome || "";
    const tipo = fields.tipo || "";
    const conexao = fields.conexao || "";
    const implante_info = fields.implante_info || "";
    const comentarios = fields.comentarios || "";
    const link = fields.link || "";

    // Novos campos (podem vir como array ou string)
    // Para fields enviados como dentes[] -> formidable entrega 'dentes[]' ou 'dentes' dependendo; suportamos ambos
    let dentes = [];
    if (fields["dentes[]"]) dentes = Array.isArray(fields["dentes[]"]) ? fields["dentes[]"] : [fields["dentes[]"]];
    else if (fields.dentes) dentes = Array.isArray(fields.dentes) ? fields.dentes : [fields.dentes];

    const material = fields.material || "";

    let cores_vita = [];
    if (fields["cores_vita[]"]) cores_vita = Array.isArray(fields["cores_vita[]"]) ? fields["cores_vita[]"] : [fields["cores_vita[]"]];
    else if (fields.cores_vita) cores_vita = Array.isArray(fields.cores_vita) ? fields.cores_vita : [fields.cores_vita];

    console.log("dentes:", dentes);
    console.log("material:", material);
    console.log("cores_vita:", cores_vita);

    // Monta HTML do e-mail (ajuste conforme quiser)
    const html = `
      <h2>Novo envio - Formulário de Ordem de Serviço/Escaneamento</h2>
      <ul>
        <li><strong>Cirurgião:</strong> ${escapeHtml(cirurgia_nome)} ${escapeHtml(cirurgia_sobrenome)}</li>
        <li><strong>Paciente:</strong> ${escapeHtml(paciente_nome)} ${escapeHtml(paciente_sobrenome)}</li>
        <li><strong>Tipo:</strong> ${escapeHtml(tipo)}</li>
        <li><strong>Conexão:</strong> ${escapeHtml(conexao)}</li>
        <li><strong>Implante / Obs:</strong> ${escapeHtml(implante_info)}</li>
        <li><strong>Material:</strong> ${escapeHtml(material)}</li>
        <li><strong>Dentes:</strong> ${escapeHtml(dentes.join(", "))}</li>
        <li><strong>Cores VITA:</strong> ${escapeHtml(cores_vita.join(", "))}</li>
        <li><strong>Link do escaneamento:</strong> ${escapeHtml(link)}</li>
        <li><strong>Comentários:</strong> ${escapeHtml(comentarios)}</li>
      </ul>
    `;

    // Prepare attachments array
    const attachments = [];

    // files may have single or multiple entries
    // nome esperado: foto_frontal, foto_escala, arquivos (múltiplos)
    // Formidable em versões modernas usa: files.fieldName.filepath e mimetype
    const addFile = async (fileObj, fallbackName) => {
      if (!fileObj) return;
      // fileObj pode ser array (quando multiples true) ou objeto
      if (Array.isArray(fileObj)) {
        for (const f of fileObj) {
          await pushAttachmentFromFile(f, attachments, fallbackName);
        }
      } else {
        await pushAttachmentFromFile(fileObj, attachments, fallbackName);
      }
    };

    await addFile(files.foto_frontal, "foto_frontal");
    await addFile(files.foto_escala, "foto_escala");
    await addFile(files.arquivos, "arquivo");

    // Cria transporter
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 0);
    let smtpSecure = process.env.SMTP_SECURE;
    // deduz secure: porta 465 -> true
    if (typeof smtpSecure === "undefined" || smtpSecure === "") {
      smtpSecure = smtpPort === 465 ? true : false;
    } else {
      // se definida por env, aceitar "true"/"false" strings
      smtpSecure = smtpSecure === "true" || smtpSecure === true;
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

    // teste simples de verificação do transporter (opcional - comentável em produção)
    // await transporter.verify();

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.TO_EMAIL,
      subject: `Novo formulário de escaneamento - ${paciente_nome} ${paciente_sobrenome}`,
      text: stripHtml(html).slice(0, 1000), // fallback
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

/* ---------------- helper functions ---------------- */

async function pushAttachmentFromFile(fileMeta, attachments, fallbackName) {
  // formidable file object has .filepath (newer) or .path (older)
  if (!fileMeta) return;
  const path = fileMeta.filepath || fileMeta.file || fileMeta.path;
  if (!path) return;
  const filename = fileMeta.originalFilename || fileMeta.newFilename || fileMeta.name || fallbackName;
  let content;
  try {
    content = await readFile(path);
  } catch (err) {
    console.warn("Could not read uploaded file:", path, err);
    return;
  }
  const contentType = fileMeta.mimetype || fileMeta.type || undefined;
  attachments.push({
    filename,
    content,
    contentType,
  });
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(html = "") {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
}
