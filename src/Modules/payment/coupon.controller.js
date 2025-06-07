import { Router } from "express";
import * as couponService from "./service/coupon.service.js";
import { authentication, authorization } from "../../Middleware/authentication/authentication.js";
import { roletypes } from "../../DB/models/user.model.js";

const couponRouter = Router();

couponRouter.post('/create', authentication(), authorization([roletypes.admin, roletypes.instructor]), couponService.createCoupon);

couponRouter.get('/', authentication(), couponService.getCoupons);

couponRouter.get('/:couponCode', authentication(), couponService.getCouponByCode);

couponRouter.patch('/:couponCode', authentication(), authorization([roletypes.admin, roletypes.instructor]), couponService.updateCoupon);

couponRouter.get('/instructor/all', authentication(), authorization([roletypes.instructor]), couponService.getInstructorCoupons);

couponRouter.patch('/:couponCode/status', authentication(), authorization([roletypes.admin, roletypes.instructor]), couponService.activateAndDeactivateCoupon);


export default couponRouter;
