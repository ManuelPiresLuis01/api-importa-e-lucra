const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || "", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error", err));

const submissionSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  selectedType: String,
  createdAt: { type: Date, default: Date.now },
});
const Submission = mongoose.model("Submission", submissionSchema);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateUserHtml(name, tipo) {
  const adminEmail = process.env.ADMIN_EMAIL || '';
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Comprovativo Recebido</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .wrapper {
      width: 100%;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.05);
      padding: 32px;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    h1 {
      color: #FBBF24;
      font-size: 24px;
      margin: 0;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #1e293b;
      margin: 16px 0;
    }
    .highlight {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      margin: 20px 0;
      font-size: 15px;
      line-height: 1.6;
    }
    .highlight li {
      margin-bottom: 8px;
    }
    a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    footer {
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <div class="header">
        <h1>Comprovativo Recebido</h1>
      </div>

      <p>Olá ${name},</p>

      <p>Recebemos o seu comprovativo para a modalidade <strong>${tipo}</strong>. Obrigado por escolher a nossa formação.</p>

      <div class="highlight">
        Estamos a analisar a sua inscrição e em até <strong>24 horas</strong> entraremos em contacto para:
        <ul>
          <li>✔ Validar oficialmente a sua inscrição</li>
          <li>✔ Enviar o link da nossa comunidade exclusiva no WhatsApp</li>
        </ul>
        <br/>
        <em>Equipa da Importação com Lucro</em>
      </div>

      <p>Atenciosamente,<br/><em>Equipa da Importação com Lucro</em></p>

      <p>Se precisar de assistência, contacte-nos em <a href="mailto:${adminEmail}">Equipa da Importação com Lucro</a>.</p>

      <footer>Importação com Lucro</footer>

    </div>
  </div>
</body>
</html>`;
}

function generateAdminHtml(name, email, phone, tipo, fileName) {
  const adminEmail = process.env.ADMIN_EMAIL || '';
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nova Inscrição Recebida</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .wrapper {
      width: 100%;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.05);
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: #1e293b;
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 50px;
      margin-bottom: 14px;
    }
    h1 {
      font-size: 20px;
      margin: 0;
      color: #111827;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
      margin: 16px 0;
    }
    .info-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-item {
      margin-bottom: 10px;
      font-size: 14px;
      color: #111827;
    }
    .label {
      font-weight: 600;
      color: #374151;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
    footer {
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <div class="header">
        <div class="badge">Notificação do Sistema</div>
        <h1>Novo Comprovativo Submetido</h1>
      </div>

      <p>
        Uma nova inscrição foi registada na plataforma. Consulte abaixo os dados enviados pelo participante:
      </p>

      <div class="info-box">
        <div class="info-item">
          <span class="label">Nome:</span> ${name}
        </div>
        <div class="info-item">
          <span class="label">Email:</span> ${email}
        </div>
        <div class="info-item">
          <span class="label">Telefone:</span> ${phone}
        </div>
        <div class="info-item">
          <span class="label">Modalidade:</span> ${tipo}
        </div>
        <div class="info-item">
          <span class="label">Arquivo:</span> ${fileName}
        </div>
      </div>

      <div class="divider"></div>

      <p>
        O ficheiro correspondente encontra-se anexado a este email para verificação e validação da inscrição.
      </p>

      <footer>
        Importação com Lucro • Notificação automática do sistema
      </footer>

    </div>
  </div>
</body>
</html>`;
}

const upload = multer({ dest: uploadDir });

app.post("/api/submit", upload.single("file"), async (req, res) => {
  try {
    const { name, email, phone, tipo_formacao } = req.body;
    if (!name || !email || !phone || !tipo_formacao || !req.file) {
      return res.status(400).json({ error: "Campos em falta" });
    }

    const file = req.file;
    const targetPath = path.join(uploadDir, file.originalname);
    fs.renameSync(file.path, targetPath);

    const submission = await Submission.create({
      name,
      email,
      phone,
      selectedType: tipo_formacao,
    });

    await transporter.sendMail({
      from: `"Equipa da Importação com Lucro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Comprovativo recebido",
      text: `Olá ${name},\n\nRecebemos o seu comprovativo para a modalidade ${tipo_formacao}. Obrigado!`,
      html: generateUserHtml(name, tipo_formacao),
    });

    await transporter.sendMail({
      from: `"Equipa da Importação com Lucro" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Novo comprovativo enviado para formação ${tipo_formacao}`,
      text: `Dados do formulário:\nNome: ${name}\nEmail: ${email}\nTelefone: ${phone}\nModalidade: ${tipo_formacao}\nArquivo: ${file.originalname}`,
      html: generateAdminHtml(name, email, phone, tipo_formacao, file.originalname),
      attachments: [
        {
          filename: file.originalname,
          path: targetPath,
        },
      ],
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Backend running on port ${port}`));
