import { Router } from "express";
import {
  toggleInteraction,
  getMediaInteractionState,
  listUserInteractions,
} from "../controllers/interactionController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/mine/:kind", listUserInteractions); // favorites | watched | wishlist
router.get("/:mediaId/state", getMediaInteractionState);
router.post("/:mediaId/:kind", toggleInteraction);

export default router;
