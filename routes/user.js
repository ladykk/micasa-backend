require("dotenv/config");
const router = require("express").Router();
const DB = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

//Register
router.post("/register", async (req, res) => {
  try {
    let isError = false;
    //Model data
    const new_user = await User.new_user(
      req.body.username,
      req.body.password,
      req.body.full_name,
      req.body.email,
      req.body.phone_number,
      req.files !== null ? req.files.avatar_file : null
    );
    //Check if model is error
    if (await new_user.error) {
      return res.status(400).send({
        message: "error",
        error: "Format incorrect.",
        stackTrace: err.stackTrace,
      });
    }
    //Insert values
    let inserted_user;
    let insert_result = await DB.query(
      "INSERT INTO users (username, password, full_name, email, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING username, full_name, email, phone_number;",
      [
        new_user.username,
        new_user.password,
        new_user.full_name,
        new_user.email,
        new_user.phone_number,
      ]
    ).catch((err) => {
      isError = true;
      switch (err.code) {
        case "23505":
          let error = err.detail.split(" ");
          error = error[1].split("=");
          res.status(400).send({
            message: "error",
            error: `${error[0]} is already exist.`,
          });
          break;
        default:
          res.status(500).send({
            message: "error",
            error: { code: err.code, detail: err.detail },
            full_error: err,
          });
      }
    });
    //Check is error
    if (isError) return;
    //Assign inserted values
    inserted_user = insert_result.rows[0];
    //Insert values to avatars if there is avatar_files
    if (new_user.avatar_file) {
      const { name, data } = new_user.avatar_file;
      let insert_avatar_result = await DB.query(
        "INSERT INTO avatars (file_name, data) VALUES ($1, $2) RETURNING avatar_id;",
        [name, data]
      ).catch((err) => {
        isError = true;
      });
      //Check is error
      if (isError) {
        //Remove inserted user
        await DB.query("DELETE FROM users WHERE username=$1;", [
          new_user.username,
        ]).then((result) => {
          res.status(500).send({
            message: "error",
            error: "User cannot created.",
          });
        });
        return;
      }
      //Update avatar_id to user
      inserted_user.avatar_id = insert_avatar_result.rows[0].avatar_id;
      await DB.query("UPDATE users SET avatar_id=$1 WHERE username=$2;", [
        inserted_user.avatar_id,
        inserted_user.username,
      ])
        .then(() => {
          res.status(201).send({ message: "success", payload: inserted_user });
        })
        .catch(async () => {
          //Remove inserted user and avatar
          await DB.query("DELETE FROM users WHERE username=$1;", [
            inserted_user.username,
          ]).finally(async () => {
            await DB.query("DELETE FROM avatars WHERE avatar_id=$1;", [
              inserted_user.avatar_id,
            ]).finally(() => {
              res.status(500).send({
                message: "error",
                error: "User cannot created.",
              });
            });
          });
        });
    } else {
      res.status(201).send({ message: "success", payload: inserted_user });
    }
  } catch (err) {
    console.log(err);
    //Error occurs
    res.status(500).send({
      message: "error",
      error: err.toString(),
      stackTrace: err.stack,
    });
  }
});
//Login
router.post("/login", async (req, res) => {
  try {
    const user_result = await DB.query(
      "SELECT * FROM users WHERE username=$1;",
      [req.body.username]
    ).catch((err) => {
      res.status(500).send({
        message: "error",
        error: { code: err.code, detail: err.detail },
        full_error: err,
      });
    });
    const user = user_result.rows[0];

    //Check if user not found.
    if (!user) {
      return res
        .status(401)
        .send({ message: "error", error: "Invalid Credential" });
    } else {
      const authenticated = await bcrypt.compare(
        req.body.password,
        user.password
      );
      //Check is authenticated
      if (!authenticated) {
        return res
          .status(401)
          .send({ message: "error", error: "Invalid Credential" });
      } else {
        //Generate Token
        const token = jwt.sign({ username: user.username }, process.env.SECRET);
        res.cookie("jwt", token, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000, //1 Month
        });
        res.status(201).send({ message: "success" });
      }
    }
  } catch (err) {
    console.log(err);
    //Error occurs
    res.status(500).send({
      message: "error",
      error: err.toString(),
      stackTrace: err.stack,
    });
  }
});
//Get user
router.get("/user", async (req, res) => {
  try {
    //Get Token
    const cookie = req.cookies["jwt"];
    //Verify Token
    const claim = jwt.verify(cookie, process.env.SECRET);
    //Check is invalid
    if (!claim) {
      res.status(401).send({
        message: "error",
        error: "Unauthorized",
      });
      return;
    } else {
      const user_result = await DB.query(
        "SELECT * FROM users WHERE username=$1;",
        [claim.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });

      //Check if user is found.
      if (!user_result.rows[0]) {
        res.cookie("jwt", "", { maxAge: 0 });
        return res
          .status(401)
          .status({ message: "error", error: "Unauthorized" });
      }

      //Separate password with other information.
      const { password, ...raw_user } = await user_result.rows[0];

      //Check is a webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [raw_user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
      });
      const webmaster = await webmaster_result.rows[0];
      if (webmaster) {
        const user = {
          ...raw_user,
          birthday: new Date(raw_user.birthday),
          class: "Webmaster",
          webmaster_id: webmaster.webmaster_id,
        };
        res.status(201).send(user);
        return;
      }

      //Check is an agent
      const agent_result = await DB.query(
        "SELECT * FROM agents WHERE username=$1;",
        [raw_user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
      });
      const agent = await agent_result.rows[0];
      if (agent) {
        const user = {
          ...raw_user,
          birthday: new Date(raw_user.birthday),
          class: "Agent",
          agent_id: agent.agent_id,
        };
        res.status(201).send(user);
        return;
      }

      //Check is customer have an agent
      const customer_agent = await DB.query(
        "SELECT * FROM agent_customers WHERE username=$1;",
        [raw_user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
      });
      if (customer_agent.rows[0]) {
        const agent = await DB.query(
          "SELECT agent_id, full_name, email, phone_number, avatar_id FROM agent_users WHERE agent_id=$1",
          [customer_agent.rows[0].agent_id]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
        });
        const user = {
          ...raw_user,
          birthday: new Date(raw_user.birthday),
          class: "Customer",
          agent: agent.rows[0],
        };
        res.status(201).send(user);
      } else {
        const user = {
          ...raw_user,
          birthday: new Date(raw_user.birthday),
          class: "Customer",
          agent: null,
        };
        res.status(201).send(user);
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(400).send({ message: "error" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
    });
  }
});
//Logout
router.post("/logout", async (req, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).send({ message: "success" });
});
//Update
router.patch("/update", async (req, res) => {
  try {
    //Format data
    const inputs = {
      full_name: req.body.full_name,
      email: req.body.email,
      phone_number: req.body.phone_number,
      gender: req.body.gender,
      birthday: req.body.birthday,
      avatar_file: req.files !== null ? req.files.avatar_file : undefined,
    };

    //Get Token
    const cookie = req.cookies["jwt"];
    //Verify Token
    const claim = jwt.verify(cookie, process.env.SECRET);
    //Check is invalid
    if (!claim) {
      res.status(401).send({
        message: "error",
        error: "Unauthorized",
      });
      return;
    } else {
      const user_result = await DB.query(
        "SELECT * FROM users WHERE username=$1;",
        [claim.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });

      //Check if user is found.
      if (!user_result.rows[0]) {
        res.cookie("jwt", "", { maxAge: 0 });
        return res
          .status(401)
          .status({ message: "error", error: "Unauthorized" });
      }

      //Separate password with other information.
      const { username, avatar_id, ...old_data } = await user_result.rows[0];

      let isError = false;

      for (let attribute in inputs) {
        if (!inputs[attribute]) continue;
        switch (attribute) {
          case "avatar_file":
            const { name, data } = inputs.avatar_file;
            if (avatar_id) {
              await DB.query(
                "UPDATE avatars SET file_name=$1, data=$2 WHERE avatar_id=$3;",
                [name, data, username]
              ).catch((err) => {
                console.log(err);
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
                isError = true;
              });
            } else {
              let insert_avatar_result = await DB.query(
                "INSERT INTO avatars (file_name, data) VALUES ($1, $2) RETURNING avatar_id;",
                [name, data]
              ).catch((err) => {
                console.log(err);
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
                isError = true;
              });
              //Check is error
              if (!isError) {
                //Update avatar_id to user
                await DB.query(
                  "UPDATE users SET avatar_id=$1 WHERE username=$2;",
                  [insert_avatar_result.rows[0].avatar_id, username]
                ).catch((err) => {
                  console.log(err);
                  res.status(500).send({
                    message: "error",
                    error: { code: err.code, detailL: err.detail },
                    full_error: err,
                  });
                  isError = true;
                });
              }
            }
            break;
          default:
            await DB.query(
              `UPDATE users SET ${attribute}=$1 WHERE username=$2;`,
              [inputs[attribute], username]
            ).catch((err) => {
              console.log(err);
              res.status(500).send({
                message: "error",
                error: { code: err.code, detailL: err.detail },
                full_error: err,
              });
              isError = true;
            });
        }
        if (isError) break;
      }
      if (!isError) {
        res.status(201).send({
          message: "success",
        });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "error",
    });
  }
});
//Remove Avatar
router.delete("/remove_avatar", async (req, res) => {
  try {
    //Get Token
    const cookie = req.cookies["jwt"];
    //Verify Token
    const claim = jwt.verify(cookie, process.env.SECRET);
    //Check is invalid
    if (!claim) {
      res.status(401).send({
        message: "error",
        error: "Unauthorized",
      });
      return;
    } else {
      const user_result = await DB.query(
        "SELECT * FROM users WHERE username=$1;",
        [claim.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });

      //Check if user is found.
      if (!user_result.rows[0]) {
        res.cookie("jwt", "", { maxAge: 0 });
        return res
          .status(401)
          .status({ message: "error", error: "Unauthorized" });
      }

      //Separate password with other information.
      const { username, avatar_id, ...old_data } = await user_result.rows[0];

      await DB.query("DELETE FROM avatars WHERE avatar_id=$1;", [avatar_id])
        .then((result) => {
          res.status(201).send({ message: "success" });
        })
        .catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
        });
    }
  } catch (err) {}
});

module.exports = router;
