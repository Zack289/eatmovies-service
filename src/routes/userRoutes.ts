import { Router } from "express";
import { listMyMedia } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/me/media", requireAuth, listMyMedia);

export default router;
