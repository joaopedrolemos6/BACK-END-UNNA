import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

// Garante que a pasta uploads existe na raiz do projeto
const UPLOADS_FOLDER = path.resolve(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
}

export default {
  directory: UPLOADS_FOLDER,
  
  // Configuração de armazenamento local (Disco)
  storage: multer.diskStorage({
    destination: UPLOADS_FOLDER,
    filename(request, file, callback) {
      // Cria um hash aleatório para evitar nomes iguais
      const fileHash = crypto.randomBytes(10).toString("hex");
      
      // Limpa espaços e caracteres especiais do nome original
      const sanitizedName = file.originalname.replace(/\s/g, "-");
      
      const fileName = `${fileHash}-${sanitizedName}`;

      return callback(null, fileName);
    },
  }),
  
  // Limite de tamanho (ex: 5MB)
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },

  // Filtro para aceitar apenas imagens
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/webp"
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and WEBP are allowed."));
    }
  }
};