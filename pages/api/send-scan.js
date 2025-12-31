import nodemailer from "nodemailer";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

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
    return res
      .status(500)
      .send("SMTP envs faltando: " + missing.join(", "));
  }

  const form = formidable({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao processar formulário");
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const attachments = [];
    for (const key in files) {
      const f = Array.isArray(files[key]) ? files[key] : [files[key]];
      f.forEach((file) => {
        attachments.push({
          filename: file.originalFilename,
          content: fs.readFileSync(file.filepath),
        });
      });
    }

    const html = `
      <h2>Novo envio - Formulário de Escaneamento</h2>
      <ul>
        <li><b>Cirurgião:</b> ${fields.cirurgiao_nome} ${fields.cirurgiao_sobrenome}</li>
        <li><b>Paciente:</b> ${fields.paciente_nome} ${fields.paciente_sobrenome}</li>
        <li><b>Tipo:</b> ${fields.tipo_escaneamento}</li>
        <li><b>Conexão:</b> ${fields.conexao_implante}</li>
        <li><b>Implante:</b> ${fields.implante_info}</li>
        <li><b>Link:</b> ${fields.link_escaneamento}</li>
      </ul>
      <p>${fields.comentarios || ""}</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.TO_EMAIL,
      subject: "Novo formulário de escaneamento",
      html,
      attachments,
    });

    return res.status(200).send("OK");
  });
}
