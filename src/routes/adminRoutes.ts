import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/adminAuth";
import {
  getDashboardStats,
  listUsers,
  updateUserRole,
  deleteUser,
  listAllMediaForAdmin,
  setMediaStatus,
  adminDeleteMedia,
} from "../controllers/adminController";

const router = Router();

// Every admin route requires a valid, authenticated admin — enforced on the
// backend regardless of what the frontend hides or shows.
router.use(requireAuth, requireAdmin);

router.get("/stats", getDashboardStats);

router.get("/users", listUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.get("/media", listAllMediaForAdmin);
router.put("/media/:id/status", setMediaStatus);
router.delete("/media/:id", adminDeleteMedia);

export default router;
