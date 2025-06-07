import { Router } from "express";
import { authentication } from "../../Middleware/authentication/authentication.js";
import * as paymentService  from "./service/payment.service.js";


const paymentRouter = Router({ mergeParams: true });


paymentRouter.post('/', authentication(),paymentService.createCheckoutSession);


export default paymentRouter;