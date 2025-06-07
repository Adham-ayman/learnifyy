import { Router } from "express";
import { authentication } from "../../Middleware/authentication/authentication.js";
import  * as taskService from "./service/task.service.js";




const taskRouter = Router();


taskRouter.post('/', authentication(), taskService.createTask); 
taskRouter.put('/:taskId', authentication(), taskService.updateTask); 
taskRouter.delete('/:taskId', authentication(), taskService.deleteTask); 
taskRouter.get('/', authentication(), taskService.getTasks);
taskRouter.get('/:taskId', authentication(), taskService.getTask);


export default taskRouter;