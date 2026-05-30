import express from "express";
import multer from "multer";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

interface CreateServerOptions {
  uploadsDir?: string;
}

interface AudioUploadRequest extends express.Request {
  generatedAudioId?: string;
}

const defaultUploadsDir = resolve(process.cwd(), "data", "uploads");
const mp3UploadRequiredMessage = 'MP3 file is required in multipart field "file".';
const invalidMp3Message = "Only MP3 audio uploads are supported.";

function createAudioId() {
  return `audio-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

function isAcceptedMp3(file: Express.Multer.File) {
  return (
    file.mimetype === "audio/mpeg" ||
    file.originalname.toLowerCase().endsWith(".mp3")
  );
}

function titleFromUpload(file: Express.Multer.File, formTitle: unknown) {
  const title = typeof formTitle === "string" ? formTitle.trim() : "";

  if (title) {
    return title;
  }

  const filename = basename(file.originalname);
  const extension = extname(filename);

  return extension.toLowerCase() === ".mp3"
    ? filename.slice(0, -extension.length)
    : filename;
}

export function createServer(options: CreateServerOptions = {}) {
  const app = express();
  const uploadsDir = options.uploadsDir ?? defaultUploadsDir;

  mkdirSync(uploadsDir, { recursive: true });

  const upload = multer({
    fileFilter: (_request, file, callback) => {
      if (isAcceptedMp3(file)) {
        callback(null, true);
        return;
      }

      callback(new Error(invalidMp3Message));
    },
    storage: multer.diskStorage({
      destination: (_request, _file, callback) => {
        callback(null, uploadsDir);
      },
      filename: (request: AudioUploadRequest, _file, callback) => {
        const audioId = createAudioId();
        request.generatedAudioId = audioId;
        callback(null, `${audioId}.mp3`);
      },
    }),
  });

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post("/api/uploads/audio", (request: AudioUploadRequest, response) => {
    upload.single("file")(request, response, (error: unknown) => {
      if (error) {
        response.status(400).json({
          error:
            error instanceof Error && error.message === invalidMp3Message
              ? invalidMp3Message
              : mp3UploadRequiredMessage,
        });
        return;
      }

      if (!request.file || !request.generatedAudioId) {
        response.status(400).json({ error: mp3UploadRequiredMessage });
        return;
      }

      response.json({
        id: request.generatedAudioId,
        src: `/uploads/${request.generatedAudioId}.mp3`,
        title: titleFromUpload(request.file, request.body.title),
      });
    });
  });

  return app;
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  const port = Number(process.env.PORT ?? 3001);
  const app = createServer();

  app.listen(port, () => {
    console.log(`Riskuj API běží na http://localhost:${port}`);
  });
}
