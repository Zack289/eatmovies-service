import { Router } from "express";
import {
  listMedia,
  searchSuggestions,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia,
  getRecommendations,
} from "../controllers/mediaController";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/search", searchSuggestions);
router.get("/recommendations", optionalAuth, getRecommendations);
router.get("/", listMedia);
router.get("/:id", getMediaById);
router.post("/", requireAuth, createMedia);
router.put("/:id", requireAuth, updateMedia);
router.delete("/:id", requireAuth, deleteMedia);

export default router;
