
export const userMiddleware = (req, res, next) => {
  const user = {
    role: "anon",
    id: ""
  }
  // Rest of the auth check
  if (!req.headers["authorization"]) {
    req.user = user
    return next()
  }

  // Check for the token
  const [payload, status] = 
  next()
}