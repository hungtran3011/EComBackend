import AuthControllers from "../controllers/auth.controller"

router.get("/sign-in", AuthControllers.signIn)

router.post("/sign-up", AuthControllers.registerUser)