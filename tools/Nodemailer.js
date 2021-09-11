const nodemailer = require("nodemailer");
const fs = require("fs");
const hoganJS = require("hogan.js");

//get file
const template = fs.readFileSync(
  "./views/forget_password_template.hjs",
  "utf-8"
);
//compile template
const compliedTemplate = hoganJS.compile(template);

// setup mail transporter service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "micasacorp2000@gmail.com", // your email
    pass: "Micasa2000", // your password
  },
});

// setup email data with unicode symbols
const forgetPasswordMailOptions = (user, token) => {
  return {
    from: "micasacorp2000@gmail.com", // sender
    to: user.email, // list of receivers
    subject: "MI CASA - Recover Email", // Mail subject
    html: compliedTemplate.render({
      full_name: user.full_name,
      timestamp: new Date().toLocaleString(),
      token,
    }), // HTML body
  };
};

const sendRecoveryEmail = (user, token) => {
  transporter.sendMail(
    forgetPasswordMailOptions(user, token),
    function (err, info) {
      if (err) {
        console.log(`Cannot send recover email: (User: ${user.username})`);
        console.log(err);
      }
    }
  );
};

module.exports = {
  sendRecoveryEmail,
};
