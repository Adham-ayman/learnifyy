import { Router } from "express";
import { authentication } from "../../Middleware/authentication/authentication.js";
import { deepcheck, generateQuiz, generateStudyPlan, getChatHistory, getProgressChat, sendMessage, studyPlan } from "./service/chat.service.js";




const chatRouter = Router();

chatRouter.post('/generate', authentication(), generateStudyPlan);
chatRouter.get('/progress/:courseId', authentication(), getProgressChat);
chatRouter.get('/study-plan', authentication(), studyPlan);
chatRouter.post('/generate-quiz',authentication(), generateQuiz);
chatRouter.post('/gen', deepcheck);
chatRouter.post("/message", authentication(), sendMessage);

chatRouter.get("/history", authentication(), getChatHistory);




export default chatRouter;