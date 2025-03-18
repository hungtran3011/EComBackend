import jwt from 'jsonwebtoken'
import { config } from 'dotenv'

config()

const verifyJWTTokens = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    return null
  }
}