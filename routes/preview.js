const router = require("express").Router();
const hoganJS = require("hogan.js");
const fs = require("fs");

//get file
const template = fs.readFileSync(
  "./views/forget_password_template.hjs",
  "utf-8"
);
//compile template
const compliedTemplate = hoganJS.compile(template);

router.get("/forgetpassword", async (req, res) => {
  res.send(
    compliedTemplate.render({
      full_name: "Full Customer Name",
      timestamp: new Date().toLocaleString(),
      token:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibWljYXNhIn0.scK8eN5MeQZnEVOiD5RBqqHuBt_ycxD7qEEVubiyzrs",
    })
  );
});

module.exports = router;
