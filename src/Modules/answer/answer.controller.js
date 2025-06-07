import { Router } from "express";
import { authentication } from "../../Middleware/authentication/authentication.js";
import { getAnswers, submitSubmission } from "./service/answer.service.js";

 const answerRouter = Router()




answerRouter.post('/submissions', authentication(), submitSubmission);
answerRouter.get('/answers/:quizId', authentication(), getAnswers);


export default answerRouter;