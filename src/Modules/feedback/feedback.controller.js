import { Router } from "express";
import { authentication } from "../../Middleware/authentication/authentication.js";
import * as feedbackService  from "./service/feedback.service.js";



const feedbackRouter = Router({ mergeParams: true });


feedbackRouter.post('/', authentication(), feedbackService.createFeedback);
feedbackRouter.put('/:feedbackId', authentication(), feedbackService.updateFeedback);
feedbackRouter.delete('/:feedbackId', authentication(), feedbackService.deleteFeedback);
feedbackRouter.get('/', feedbackService.getCourseFeedbacks);
feedbackRouter.get('/my-feedbacks', authentication(),feedbackService.getMyFeedbacks);








export default feedbackRouter;