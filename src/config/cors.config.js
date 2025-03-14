const whiteList = [
  "http://localhost:8080", 
  "http://localhost:3000", 
  "https://myapp.com"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}