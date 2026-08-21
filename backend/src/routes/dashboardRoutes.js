import { Router } from "express";
import {
  getDashboardStats,
  getEnumeratorAnalysis,
  getDistrictAnalysis,
} from "../controllers/dashboardController.js";

const router = Router();

router.get("/stats", getDashboardStats);
router.get("/enumerators", getEnumeratorAnalysis);
router.get("/districts", getDistrictAnalysis);

export default router;
