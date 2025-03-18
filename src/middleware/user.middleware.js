import jwt from "jsonwebtoken"
import { config } from "dotenv"

config()

/**
 * @name userMiddleware
 * @description Middleware kiểm tra người dùng đã đăng nhập hay chưa
 * @example `router.get("/some-protected-route", userMiddleware, (req, res) => { ... })`
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
export const userMiddleware = (req, res, next) => {
  const defaultUser = {
    role: "anon",
    id: ""
  }
  // Rest of the auth check
  if (!req.headers["authorization"]) {
    req.user = defaultUser
    res.sendStatus(401)
    res.send("No token provided")
  }

  const token = req.headers["authorization"].split(" ")[1]
  if (!token) {
    req.user = defaultUser
    res.sendStatus(401)
    res.send("No token provided")
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      req.user = defaultUser
      res.sendStatus(403)
      res.send("Invalid token")
    }
    req.user = user
  })
  next()
}