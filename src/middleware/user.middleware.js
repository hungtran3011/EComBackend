
export const userMiddleware = (req, res, next) => {
  const user = {
    role: "anon",
    id: ""
  }
  // Rest of the auth check
  next()
}