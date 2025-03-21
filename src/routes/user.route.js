import { Router } from "express";

import UserControllers from "../controllers/user.controller.js";
import { userMiddleware } from "../middleware/user.middleware.js";
import { IPRateLimiter } from "../config/rate-limit.js";

const router = Router()

router
  .get("/", IPRateLimiter, userMiddleware, UserControllers.getAllUsers)
  .post("/", IPRateLimiter, userMiddleware, UserControllers.createNonRegisteredUser)

router
  .get("/:id", IPRateLimiter, userMiddleware, (req, res) => {
    res.send("User route")
  })
  .post("/:id", IPRateLimiter, userMiddleware, (req, res) => {
    res.send("User route")
  })
  .put("/:id", IPRateLimiter, userMiddleware, (req, res) => {
    res.send("User route")
  })
  .delete("/:id", IPRateLimiter, userMiddleware, (req, res) => {
    res.send("User route")
  })

export {router as UserRouter};
