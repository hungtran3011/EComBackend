import { Router } from "express";

import UserControllers from "../controllers/user.controller.js";
import { userMiddleware } from "../middleware/user.middleware.js";
import { IPRateLimiter } from "../config/rate-limit.js";

const router = Router()

router.get("/user", IPRateLimiter, userMiddleware, UserControllers.getAllUsers)

router
  .get("/user/:id", IPRateLimiter, userMiddleware, (req, res) => {
    res.send("User route")
  })
  .post("/user/:id", IPRateLimiter, userMiddleware, (req, res) => {
    res.send("User route")
  })
  .put("/user/:id", IPRateLimiter, userMiddleware, (req, res) => {
    res.send("User route")
  })
  .delete("/user/:id", IPRateLimiter, userMiddleware, (req, res) => {
    res.send("User route")
  })

export {router as UserRouter};
