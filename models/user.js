require("dotenv/config");
const bcrypt = require("bcryptjs");

const new_user = async (
  username,
  password,
  full_name,
  email,
  phone_number,
  avatar_file
) => {
  try {
    //Generate Hash Password
    const salt = await bcrypt.genSalt(10);
    const hash_password = await bcrypt.hash(password, salt);
    //Form new_user model
    let new_user = {
      username: username,
      password: hash_password,
      full_name: full_name,
      email: email,
      phone_number: phone_number,
    };
    //Add avatar_file if exist.
    if (avatar_file) {
      new_user.avatar_file = avatar_file;
    }
    //Return new model
    return new_user;
  } catch (err) {
    //Catch error
    console.error("User Model: Cannot create new user. [new_user()]");
    console.error(err);
    return {
      message: "error",
      error: err.toString(),
      from: "user_model",
      stackTrace: err.stack,
    };
  }
};

module.exports = {
  new_user,
};
