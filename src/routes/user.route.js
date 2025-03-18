import { Router } from "express";

import UserControllers from "../controllers/user.controller";
import { userMiddleware } from "../middleware/user.middleware";
import { IPRateLimiter } from "../config/rate-limit";

const router = Router()

router.get("/user", IPRateLimiter, userMiddleware, UserControllers.getAllUsers)

router
  .get("/user/:id", userMiddleware, (req, res) => {
    res.send("User route")
  })
  .post("/user/:id", userMiddleware, (req, res) => {
    res.send("User route")
  })
  .put("/user/:id", userMiddleware, (req, res) => {
    res.send("User route")
  })
  .delete("/user/:id", userMiddleware, (req, res) => {
    res.send("User route")
  })

export {router as UserRouter};
