const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const { Resend } = require("resend");
const cloudinary = require("cloudinary").v2;
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  comprovativo: String,
  selectedType: String,
  createdAt: { type: Date, default: Date.now },
});
const Submission = mongoose.model("Submission", submissionSchema);

const supportEmail = process.env.SUPPORT_EMAIL || "";
const resendFrom = process.env.RESEND_FROM || "";
const resend = new Resend(process.env.RESEND_API_KEY);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map(e => e.trim()).filter(Boolean);
console.log("ADMIN_EMAIL parsed:", adminEmails);

function generateUserHtml(name, tipo) {
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

      <p>Se precisar de assistência, contacte-nos em <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

      <footer>Importação com Lucro</footer>

    </div>
  </div>
</body>
</html>`;
}

function generateAdminHtml(name, email, phone, tipo, fileName, fileUrl) {
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
        <div class="info-item">
          <span class="label">Imagem:</span>
          <a href="${fileUrl}"><img src="${fileUrl}" alt="Comprovativo" style="max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb;" /></a>
        </div>
      </div>

      <div class="divider"></div>

      <p>
        O ficheiro correspondente encontra-se disponível no link abaixo para verificação e validação da inscrição.
      </p>

      <p>
        Para qualquer questão de suporte, contacte <a href="mailto:${supportEmail}">${supportEmail}</a>.
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


app.get("/ping", (req, res) => {
  console.log("Servidor está vivo:", new Date().toISOString());
  res.send("Servidor está vivo:");
});

app.post("/api/submit", upload.single("file"), async (req, res) => {
  try {
    const { name, email, phone, tipo_formacao } = req.body;
    if (!name || !email || !phone || !tipo_formacao || !req.file) {
      return res.status(400).json({ error: "Campos em falta" });
    }

    const file = req.file;
    const targetPath = path.join(uploadDir, file.originalname);
    fs.renameSync(file.path, targetPath);

    const uploadResult = await cloudinary.uploader.upload(targetPath, {
      folder: process.env.CLOUDINARY_FOLDER || "importa-e-lucra",
      resource_type: "auto",
    });
    const fileUrl = uploadResult.secure_url;

    await Submission.create({
      name,
      email,
      phone,
      comprovativo: fileUrl,
      selectedType: tipo_formacao,
    });

    const userEmailResult = await resend.emails.send({
      from: resendFrom,
      to: email,
      subject: "Comprovativo recebido",
      text: `Olá ${name},\n\nRecebemos o seu comprovativo para a modalidade ${tipo_formacao}. Obrigado!`,
      html: generateUserHtml(name, tipo_formacao),
      reply_to: supportEmail || undefined,
    });
    console.log("Resend user email result:", userEmailResult);
    await delay(1000);

    try {
      fs.unlinkSync(targetPath);
    } catch (cleanupErr) {
      console.error("Failed to remove local upload:", cleanupErr);
    }

    if (adminEmails.length > 0) {
        const adminEmailResult = await resend.emails.send({
          from: resendFrom,
          to: adminEmails,
          subject: `Novo comprovativo enviado para formação ${tipo_formacao}`,
          text: `Dados do formulário:\nNome: ${name}\nEmail: ${email}\nTelefone: ${phone}\nModalidade: ${tipo_formacao}\nArquivo: ${file.originalname}\nLink: ${fileUrl}`,
          html: generateAdminHtml(name, email, phone, tipo_formacao, file.originalname, fileUrl),
          reply_to: supportEmail || undefined,
        });
        console.log(`Resend admin email result (${adminEmails}):`, adminEmailResult);
      }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno" });
  }
});

const port = process.env.PORT || 5000;

setInterval(async () => {
  try {
    const response = await fetch(`https://api-importa-e-lucra.onrender.com/ping`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text(); 
    console.log(data);
  } catch (error) {
    console.error("Erro ao chamar rota:", error);
  }
}, 10 * 60 * 1000); 

app.listen(port, () => console.log(`Backend running on port ${port}`));
