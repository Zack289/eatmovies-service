import { Router } from "express";
import multer from "multer";
import { uploadPoster } from "../controllers/uploadController";
import { requireAuth } from "../middleware/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post("/poster", requireAuth, upload.single("image"), uploadPoster);

export default router;
