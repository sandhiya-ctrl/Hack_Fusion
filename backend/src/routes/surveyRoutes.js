import { Router } from "express";
import multer from "multer";
import { listSurveys, uploadSurveyData, listRecords } from "../controllers/surveyController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/", listSurveys);
router.post("/upload", upload.single("file"), uploadSurveyData);
router.get("/records", listRecords);

export default router;
