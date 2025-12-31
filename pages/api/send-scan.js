// pages/api/send-scan.js
import nodemailer from "nodemailer";
import fs from "fs";
import { promisify } from "util";
import formidable from "formidable";

const readFile = promisify(fs.readFile);

// Required for formidable in Next.js API routes
export const config = {
  api: {
    bodyParser: false,
  },
};

/*
  Required ENV VARS (set in Vercel project settings or .env.local for local dev)
  SMTP_HOST
  SMTP_PORT
  SMTP_SECURE   (optional: "true" or "false"; if omitted, port 465 => true)
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

function isTruthyString(val) {
  if (typeof val === "string") {
    const v = val.toLowerCase().trim();
    return v === "true" || v === "1";
  }
  return !!val;
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

function stripTags(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]*>/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check envs
  const missing = envMissing();
  if (missing.length) {
    // Log which envs are present/missing (but don't print values)
    const allCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_SECURE: !!process.env.SMTP_SECURE,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_FROM: !!process.env.SMTP_FROM,
      TO_EMAIL: !!process.env.TO_EMAIL,
    };
    console.error("SMTP envs faltando:", missing);
    console.log("Env presence:", allCheck);
    return res.status(500).json({ error: "SMTP envs faltando", missing });
  }

  try {
    const { fields, files } = await parseForm(req);
    console.log("Form fields keys:", Object.keys(fields));
    console.log("Files keys:", Object.keys(files));

    // Build email HTML
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

    // Configure transporter
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 0);

    // Determine secure flag
    let smtpSecure;
    if (typeof process.env.SMTP_SECURE !== "undefined") {
      smtpSecure = isTruthyString(process.env.SMTP_SECURE);
    } else {
      smtpSecure = smtpPort === 465; // default secure for 465
    }

    console.log("SMTP config (presence only):", {
      host: !!smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: !!process.env.SMTP_USER,
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

    // Try verify (non-fatal)
    try {
      await transporter.verify();
      console.log("SMTP verified OK");
    } catch (errVerify) {
      // Some providers block verify; we continue and try to send (but log the error)
      console.warn("SMTP verify error (continuing):", String(errVerify).slice(0, 300));
    }

    // Prepare attachments (read files from disk)
    const attachments = [];
    if (files && Object.keys(files).length > 0) {
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
      text: stripTags(html).slice(0, 2000),
      html,
      attachments,
    };

    // Log limited send info (no secrets)
    console.log("Sending email:", {
      from: !!mailOptions.from,
      to: !!mailOptions.to,
      subject: mailOptions.subject,
      attachmentsCount: attachments.length,
    });

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent, id:", info && info.messageId ? info.messageId : info);

    return res.status(200).json({ ok: true, messageId: info.messageId || null });
  } catch (err) {
    console.error("Erro no send-scan:", err);
    return res.status(500).json({ error: "Erro ao processar envio", detail: String(err).slice(0, 1000) });
  }
}
