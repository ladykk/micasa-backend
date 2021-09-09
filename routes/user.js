require("dotenv/config");
const router = require("express").Router();
const DB = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const CustomError = require("../tools/CustomError");
const UserTools = require("../tools/UserTools");

//User's Function

// [POST] : Register
router.post("/register", async (req, res) => {
  try {
    //Model user and generate password.
    const new_user = await User.new_user(
      req.body.username,
      req.body.password,
      req.body.full_name,
      req.body.email,
      req.body.phone_number,
      req.files !== null ? req.files.avatar_file : null
    ).catch((err) => {
      throw new CustomError.BadRequest();
    });
    //Check is model error.
    //CASE: Model is correct.
    //Insert user to database.
    let insert_user_result = await DB.query(
      "INSERT INTO users (username, password, full_name, email, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING username, full_name, email, phone_number;",
      [
        new_user.username,
        new_user.password,
        new_user.full_name,
        new_user.email,
        new_user.phone_number,
      ]
    ).catch((err) => {
      throw new CustomError.DBError(err, "insert_user_result");
    });
    //Assign inserted values
    let inserted_user = insert_user_result.rows[0];
    //Check is user inserted.
    if (inserted_user.username) {
      //Check is has avatar.
      if (new_user.avatar_file) {
        //CASE: Has avatar.
        //Insert avatar to database.
        const { name, data } = new_user.avatar_file;
        let insert_avatar_result = await DB.query(
          "INSERT INTO avatars (file_name, data) VALUES ($1, $2) RETURNING avatar_id;",
          [name, data]
        ).catch(async (err) => {
          //Remove inserted user due to error.
          await DB.query("DELETE FROM users WHERE username=$1;", [
            new_user.username,
          ]).catch((err) => {
            throw new CustomError.DBError(err, "delete_user_result");
          });
          throw new CustomError.DBError(err, "insert_avatar_result");
        });
        //Update avatar_id to user.
        inserted_user.avatar_id = insert_avatar_result.rows[0].avatar_id;
        await DB.query("UPDATE users SET avatar_id=$1 WHERE username=$2;", [
          inserted_user.avatar_id,
          inserted_user.username,
        ]).catch(async () => {
          //Remove inserted user and avatar due to error.
          await DB.query("DELETE FROM users WHERE username=$1;", [
            inserted_user.username,
          ]).catch((err) => {
            throw new CustomError.DBError(err, "delete_user_result");
          });
          await DB.query("DELETE FROM avatars WHERE avatar_id=$1;", [
            inserted_user.avatar_id,
          ]).catch((err) => {
            throw new CustomError.DBError(err, "delete_avatar_result");
          });
          throw new CustomError.DBError(err, "update_avatar_id_result");
        });
      }
      return res
        .status(201)
        .send({ message: "success", payload: inserted_user });
    } else {
      throw new CustomError.ServerError("Cannot add user.");
    }
  } catch (err) {
    const { status, error } = CustomError.handleResponse(err);
    res.status(status).send({
      message: "error",
      error: error,
    });
  }
});
// [POST] : Login
router.post("/login", async (req, res) => {
  try {
    //Check required information.
    if (!req.body.username || !req.body.password) {
      throw new CustomError.BadRequest();
    }
    const username = req.body.username;
    const password = req.body.password;
    //Check is user exist
    const user_result = await DB.query(
      "SELECT username, password FROM users WHERE username=$1;",
      [username]
    ).catch((err) => {
      throw new CustomError.DBError(err, "user_result");
    });
    const user = user_result.rows[0];

    //Check is user exist..
    if (!user) {
      //CASE: User not exist.
      throw new CustomError.Unauthorized("Username or password is incorrect.");
    } else {
      //CASE: User exist.
      //Compare password.
      const match = await bcrypt.compare(password, user.password);
      //Check is password matched.
      if (!match) {
        //CASE: Password not match.
        throw new CustomError.Unauthorized(
          "Username or password is incorrect."
        );
      } else {
        //CASE: Password match.
        //Generate token
        const token = jwt.sign({ username: user.username }, process.env.SECRET);
        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000, //1 Month
        });
        res.status(201).send({ message: "success" });
      }
    }
  } catch (err) {
    const { status, error } = CustomError.handleResponse(err);
    res.status(status).send({
      message: "error",
      error: error,
    });
  }
});
// [GET] : Get user's detail
router.get("/user", async (req, res) => {
  try {
    //Check is has cookie
    if (!req.cookies["jwt"]) {
      //CASE: No cookie.
      return res.status(200).send({
        message: "success",
        payload: {},
      });
    }
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    }
    //Separate password with other information.
    let { password, ...raw_user } = user;
    //Check is webmaster
    const webmaster = await UserTools.checkIsWebmaster(raw_user.username);
    if (webmaster) {
      //CASE: User is webmaster.
      return res.status(200).send({
        message: "success",
        payload: {
          ...raw_user,
          ...webmaster,
          class: "Webmaster",
        },
      });
    } else {
      //CASE: User is not webmaster
      const agent = await UserTools.checkIsAgent(raw_user.username);
      //Check is agent.
      if (agent) {
        //CASE: User is agent.
        return res.status(200).send({
          message: "success",
          payload: {
            ...raw_user,
            ...agent,
            class: "Agent",
          },
        });
      } else {
        //CASE: User is not agent.
        //Check is customer
        const customer = await UserTools.checkIsCustomer(raw_user.username);
        if (customer) {
          //CASE: User is customer.
          return res.status(200).send({
            message: "success",
            payload: {
              ...raw_user,
              ...customer,
              class: "Customer",
            },
          });
        } else {
          //CASE: User has no class. (First sign-in)
          //Insert user to customer.
          await DB.query(
            "INSERT INTO customers (username) VALUES ($1) RETURNING *;",
            [raw_user.username]
          )
            .then((insert_customer_result) => {
              return res.status(200).send({
                message: "success",
                payload: {
                  ...raw_user,
                  ...insert_customer_result.rows[0],
                  class: "Customer",
                },
              });
            })
            .catch((err) => {
              throw new CustomError.DBError(err, "insert_customer_result");
            });
        }
      }
    }
  } catch (err) {
    const { status, error } = CustomError.handleResponse(err);
    if (status) {
      res.status(status).send({
        message: "error",
        error,
      });
    } else {
      res.status(500).send({
        message: "error",
        error: {
          type: "server",
          stack: err.stack,
        },
      });
    }
  }
});
// [POST] : Logout.
router.post("/logout", async (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).send({ message: "success" });
});
// [PATCH] : Update.
router.patch("/update", async (req, res) => {
  try {
    //Get inputs
    const inputs = {
      full_name: req.body.full_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      gender: req.body.gender,
      birthday: req.body.birthday,
      avatar_file: req.files !== null ? req.files.avatar_file : undefined,
    };
    //Check Authentication.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    } else {
      //CASE: User is found.
      const { username, avatar_id } = user;
      //Loop through attributes.
      for (let attribute in inputs) {
        //Check is value null.
        if (!inputs[attribute]) {
          //CASE: Attribute's value is null.
          continue;
        } else {
          //CASE: Attribute's value is not null.
          switch (attribute) {
            case "avatar_file":
              //CASE: Change avatar.
              const { name, data } = inputs.avatar_file;
              //Check is already has avatar.
              if (avatar_id) {
                //CASE: Already have avatar.
                //Update avatar.
                await DB.query(
                  "UPDATE avatars SET file_name=$1, data=$2 WHERE avatar_id=$3;",
                  [name, data, avatar_id]
                ).catch((err) => {
                  throw new CustomError.DBError(err, "update_avatar_result");
                });
              } else {
                //CASE: No avatar.
                //Insert avatar.
                await DB.query(
                  "INSERT INTO avatars (file_name, data) VALUES ($1, $2) RETURNING avatar_id;",
                  [name, data]
                )
                  .then(async (insert_avatar_result) => {
                    await DB.query(
                      "UPDATE users SET avatar_id=$1 WHERE username=$2;",
                      [insert_avatar_result.rows[0].avatar_id, username]
                    ).catch((err) => {
                      throw new CustomError.DBError(err, "update_avatar_id");
                    });
                  })
                  .catch((err) => {
                    throw new CustomError.DBError(err, "insert_avatar_result");
                  });
              }
              break;
            default:
              //CASE: Other attributes
              //Update attribute.
              await DB.query(
                `UPDATE users SET ${attribute}=$1 WHERE username=$2;`,
                [inputs[attribute], username]
              ).catch((err) => {
                throw new CustomError.DBError(
                  err,
                  `update_${attribute}_result`
                );
              });
          }
        }
      }
      return res.status(201).send({
        message: "success",
      });
    }
  } catch (err) {
    const { status, error } = CustomError.handleResponse(err);
    if (status) {
      res.status(status).send({
        message: "error",
        error,
      });
    } else {
      res.status(500).send({
        message: "error",
        error: {
          type: "server",
          stack: err.stack,
        },
      });
    }
  }
});
// [DELETE] : Remove avatar.
router.delete("/remove_avatar", async (req, res) => {
  try {
    //Check Authentication.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    } else {
      //CASE: User exist.
      const avatar_id = user.avatar_id;
      if (avatar_id) {
        //CASE: User has avatar.
        await DB.query("DELETE FROM avatars WHERE avatar_id=$1;", [
          avatar_id,
        ]).catch((err) => {
          throw new CustomError.DBError(err, "remove_avatar_result");
        });
      }
      res.status(201).send({ message: "success" });
    }
  } catch (err) {
    const { status, error } = CustomError.handleResponse(err);
    if (status) {
      res.status(status).send({
        message: "error",
        error,
      });
    } else {
      res.status(500).send({
        message: "error",
        error: {
          type: "server",
          stack: err.stack,
        },
      });
    }
  }
});

module.exports = router;
