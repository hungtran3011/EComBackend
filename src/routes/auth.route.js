import { IPRateLimiter } from "../config/rate-limit"
import AuthControllers from "../controllers/auth.controller"

router.get("/sign-in",IPRateLimiter, AuthControllers.signIn)

router.post("/sign-up", IPRateLimiter, AuthControllers.registerUser)

router.post("/sign-out", IPRateLimiter, AuthControllers.handleLogout)

router.post("/refresh-token", IPRateLimiter, AuthControllers.handleRefreshToken)