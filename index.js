const express = require("express");
const app = express();
const cors = require("cors");
const cookie_parser = require("cookie-parser");
const file_upload = require("express-fileupload");

//Import Routes
const userRoute = require("./routes/user");
const imagesRoute = require("./routes/images");
const propertyRoute = require("./routes/property");

//Middleware
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: ["http://localhosy:3000"],
  })
);
app.use(cookie_parser());
app.use(file_upload());

//Routes Middleware
app.use("/api/user", userRoute);
app.use("/images/", imagesRoute);
app.use("/api/property", propertyRoute);

app.listen(5000, () =>
  console.log(`Mi Casa Backend: Server started. (${new Date().toUTCString()})`)
);
