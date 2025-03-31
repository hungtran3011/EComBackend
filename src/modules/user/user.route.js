import { Router } from "express";

import UserControllers from "./user.controller.js";
import { userMiddleware } from "./user.middleware.js";
import { IPRateLimiter } from "../../common/config/rate-limit.js";

const router = Router()

router
  .get("/", IPRateLimiter, userMiddleware, UserControllers.getAllUsers)
  .post("/", IPRateLimiter, userMiddleware, UserControllers.createNonRegisteredUser)

router
  .get("/:id", IPRateLimiter, userMiddleware, UserControllers.getUserById)
  .put("/:id", IPRateLimiter, userMiddleware, UserControllers.updateUser)
  .delete("/:id", IPRateLimiter, userMiddleware, UserControllers.deleteUser)

export {router as UserRouter};
