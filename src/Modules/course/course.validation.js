import Joi from "joi";
import { courseFields } from "../../Middleware/validation/validation.js";


export const createCourse =Joi.object().keys({
    title:courseFields.title.required(),
    description:courseFields.description.required(),
    price:courseFields.price.required(),
    totalHours:courseFields.totalHours.required(),
    category:courseFields.category,
    level:courseFields.level,
}).options({ allowUnknown: true }).required()


