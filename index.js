const express = require("express");
const app = express();
const cors = require("cors");
const cookie_parser = require("cookie-parser");
const file_upload = require("express-fileupload");

//Import Routes
const userRoute = require("./routes/user");
const imagesRoute = require("./routes/images");
const propertyRoute = require("./routes/property");
const webmasterRoute = require("./routes/webmaster");
const customerRoute = require("./routes/customer");
const agentRoute = require("./routes/agent");
const reviewsRoute = require("./routes/reviews");
const previewRoute = require("./routes/preview");

//Middleware
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "http://ladyk.ddns.net:3000",
      "http://192.168.1.10:3000",
    ],
  })
);
app.use(cookie_parser());
app.use(file_upload());

//Routes Middleware
app.use("/api/user", userRoute);
app.use("/images/", imagesRoute);
app.use("/api/property", propertyRoute);
app.use("/api/webmaster", webmasterRoute);
app.use("/api/customer", customerRoute);
app.use("/api/agent", agentRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/preview", previewRoute);

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.send("MI CASA - Backend.");
});

app.listen(5000, () =>
  console.log(`Mi Casa Backend: Server started. (${new Date().toUTCString()})`)
);
