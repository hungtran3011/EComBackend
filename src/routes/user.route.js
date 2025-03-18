import { Router } from "express";

import UserControllers from "../controllers/user.controller";
import { userMiddleware } from "../middleware/user.middleware";

const router = Router()

router.get("sign-in", UserControllers.signIn)

router.post("/sign-up", UserControllers.signUp)

router.get("/user", userMiddleware, (req, res) => {
  res.send("User route")
})

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

export {router as UserRoutes};
