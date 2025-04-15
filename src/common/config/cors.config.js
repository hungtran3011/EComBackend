const whiteList = [
  "http://localhost:8080", 
  "http://localhost:3000", 
  "http://localhost:5555",
  "http://localhost:5173"
];

export const corsOptions = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}