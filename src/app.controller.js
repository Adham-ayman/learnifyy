import { EventEmitter } from "events";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "node:path";
import authRouter from "./Modules/auth/auth.controller.js";
import userRouter from "./Modules/user/user.controller.js";
import { globalErrorHandler } from "./Utils/errors/errorhandeler.js";
import { DBconnect } from "./DB/connection.js";
import courseRouter from "./Modules/course/course.controller.js";
import couponRouter from "./Modules/payment/coupon.controller.js";
import { stripeWebhookHandler } from "./Utils/stripe/payment.js";
import taskRouter from "./Modules/task/task.controller.js";
import chatRouter from "./Modules/chat/chat.controller.js";


import "./Utils/scheduler/taskScheduler.js"
import answerRouter from "./Modules/answer/answer.controller.js";
import roadmapRouter from "./Modules/roadmap/roadmap.controller.js";

export const bootstrap = async (express, app) => {
  await DBconnect();

  var whitelist = ["http://127.0.0.1:5501", "http://localhost:3001"]; // Add your allowed domains here

  var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        // Allow requests with no origin (like mobile apps or curl requests)
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow credentials (cookies, authorization headers)
  };
  
  app.use(cors(corsOptions));
  app.post('/checkout/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);
  app.use(express.json());
  app.use(cookieParser());
  app.use("/uploads", express.static(path.resolve("./src/Uploads")));
  EventEmitter.defaultMaxListeners = 30;
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/course", courseRouter);
  app.use("/coupon", couponRouter);
  app.use("/task", taskRouter);
  app.use('/api/chat', chatRouter);
  app.use('/answer', answerRouter);
  app.use('/roadmaps', roadmapRouter)




  app.get("/", (req, res) => res.send("welcome to our Learnify app"));
  app.use(globalErrorHandler);
  // app.use((req, res, next) => {
  //   console.log(`[${req.method}] ${req.originalUrl}`);
  //   next();
  // });
  
  app.all("*", (req, res) => {
    res.status(500).json({ message: "invalid-Routing" });
  });
};

export default bootstrap;
