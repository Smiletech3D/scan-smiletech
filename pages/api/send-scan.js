// pages/api/send-scan.js
import { IncomingForm } from "formidable";
import fs from "fs";
import os from "os";
import path from "path";
import nodemailer from "nodemailer";

export const config = {
  api: {
    bodyParser: false // obrigatório para usar formidable
  }
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const uploadDir = os.tmpdir();
    const form = new IncomingForm({ multiples: true, uploadDir, keepExtensions: true });

    const fields = {};
    const files = [];

    form.on("field", (name, value) => {
      fields[name] = value;
    });

    form.on("file", (name, file) => {
      // coletamos os arquivos
      files.push({ fieldname: name, filepath: file.filepath || file.path, originalFilename: file.originalFilename || file.name });
    });

    form.on("error", (err) => reject(err));
    form.on("end", () => resolve({ fields, files }));

    form.parse(req);
  });
}

function normalizeFiles(files) {
  // já retornamos em array, apenas garantimos
  return files || [];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { fields, files } = await parseForm(req);

    // montar attachments para nodemailer
    const allFiles = normalizeFiles(files);
    const attachments = allFiles.map((f) => ({
      filename: f.originalFilename || path.basename(f.filepath),
      path: f.filepath
    }));

    // transporter baseado nas ENV vars
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
  },
});

    // opcional: verify para erros de conexão antecipados
    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error("send-scan: transporter verify failed", verifyErr);
      return res.status(500).json({ error: `Erro na conexão SMTP: ${verifyErr.message}` });
    }

    // corpo do email
    const html = `
      <h2>Novo envio de escaneamento</h2>
      <p><strong>Dentista:</strong> ${fields.dentistName || ""} ${fields.dentistLast || ""}</p>
      <p><strong>Paciente:</strong> ${fields.patientName || ""} ${fields.patientLast || ""}</p>
      <p><strong>Tipo:</strong> ${fields.scanType || ""}</p>
      <p><strong>Conexão:</strong> ${fields.connection || ""}</p>
      <p><strong>Implante:</strong> ${fields.implantInfo || ""}</p>
      <p><strong>Comentários:</strong><br/>${(fields.comments || "").replace(/\n/g, "<br/>")}</p>
      <p><strong>Link do escaneamento:</strong><br/><a href="${fields.link || ""}">${fields.link || ""}</a></p>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.TO_EMAIL || process.env.SMTP_USER,
      subject: `Novo envio de escaneamento - ${fields.patientName || ""}`,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);

    // opcional: remover arquivos temporários (os.tmpdir())
    try {
      for (const a of attachments) {
        if (a.path && a.path.startsWith(os.tmpdir())) {
          fs.unlink(a.path, () => {});
        }
      }
    } catch (e) {
      // ignore
    }

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("send-scan error:", err);
    return res.status(500).json({ error: err?.message || "server error" });
  }
}
