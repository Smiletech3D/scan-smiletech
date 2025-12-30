import formidable from "formidable";
import fs from "fs";
import nodemailer from "nodemailer";

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  const form = formidable({ multiples: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔒 VALIDA ENVs (impede localhost)
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "TO_EMAIL",
  ];

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("❌ SMTP ENV faltando:", missing);
    return res
      .status(500)
      .json({ error: `SMTP envs faltando: ${missing.join(", ")}` });
  }

  try {
    const { fields, files } = await parseForm(req);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", // true para 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const attachments = [];

    if (files) {
      for (const key of Object.keys(files)) {
        const f = Array.isArray(files[key]) ? files[key] : [files[key]];
        f.forEach((file) => {
          attachments.push({
            filename: file.originalFilename,
            content: fs.readFileSync(file.filepath),
          });
        });
      }
    }

    const html = `
      <h2>Formulário de Escaneamento</h2>
      <ul>
        <li><b>Dentista:</b> ${fields.dentistName} ${fields.dentistLast}</li>
        <li><b>Paciente:</b> ${fields.patientName} ${fields.patientLast}</li>
        <li><b>Tipo:</b> ${fields.scanType}</li>
        <li><b>Conexão:</b> ${fields.connection}</li>
        <li><b>Implante:</b> ${fields.implantInfo}</li>
        <li><b>Comentários:</b> ${fields.comments}</li>
        <li><b>Link:</b> ${fields.link}</li>
      </ul>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.TO_EMAIL,
      subject: "Novo escaneamento recebido",
      html,
      attachments,
    });

    console.log("✅ Email enviado com sucesso");
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ ERRO SMTP:", err);
    return res.status(500).json({ error: err.message });
  }
}
