const router = require("express").Router();
const DB = require("../db");
const jwt = require("jsonwebtoken");

// Agents' functions
// [GET] : Get customers of an agent.
router.get("/customers/", async (req, res) => {
  try {
    //Get Token.
    const cookie = req.cookies["jwt"];
    //Verify Token.
    const claim = jwt.verify(cookie, process.env.SECRET);
    //Check is token invalid?
    if (!claim) {
      //CASE: Token invalid.
      return res.status(401).send({
        message: "error",
        error: "Unauthorized.",
      });
    } else {
      //CASE: Token valid.
      //Check if user exists?
      const user_result = await DB.query(
        "SELECT * FROM users WHERE username=$1; ",
        [claim.username]
      ).catch((err) => {
        return res.status(500).send({
          message: "error",
          error: {
            type: "database",
            from: "user_result",
            code: err.code,
            detail: err.detail,
            info: err,
          },
        });
      });
      if (!user_result.rows[0]) {
        //CASE: User not found.
        res.cookie("jwt", "", { maxAge: 0 });
        return res
          .status(401)
          .status({ message: "error", error: "Unauthorized" });
      }
      const user = user_result.rows[0];
      //Check user is an agent?
      const agent_result = await DB.query(
        "SELECT * FROM agents WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        return res.status(500).send({
          message: "error",
          error: {
            type: "database",
            from: "agent_result",
            code: err.code,
            detail: err.detail,
            info: err,
          },
        });
      });
      const agent = agent_result.rows[0];
      if (agent) {
        //CASE: User is an agent.
        await DB.query(
          "SELECT * FROM users INNER JOIN agent_customers USING(username) WHERE agent_id = $1;",
          [agent.agent_id]
        )
          .then((agent_customers_result) => {
            return res.status(200).send({
              message: "success",
              payload: agent_customers_result.rows,
            });
          })
          .catch((err) => {
            return res.status(500).send({
              message: "error",
              error: {
                type: "database",
                from: "agent_customers_result",
                code: err.code,
                detail: err.detail,
                info: err,
              },
            });
          });
      } else {
        //CASE: User is not an agent.
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      //CASE: No Token
      return res.status(401).send({ message: "error", error: "Unauthorized" });
    }
    //CASE: Server error
    console.error(err);
    res.status(500).send({
      message: "error",
      error: {
        type: "server",
        stack: err.stack,
      },
    });
  }
});
// [POST] : Add customer to an agent.
router.post("/customers/add", async (req, res) => {
  try {
    //Check required information
    if (!req.body.username && !req.body.agent_username) {
      //CASE: Missing some information.
      return res.status(400).send({
        message: "error",
        error: "Bad request.",
      });
    }
    //Get Token.
    const cookie = req.cookies["jwt"];
    //Verify Token.
    const claim = jwt.verify(cookie, process.env.SECRET);
    //Check is token valid?
    if (!claim) {
      //CASE: Token invalid.
      return res.status(401).send({
        message: "error",
        error: "Unauthorized",
      });
    } else {
      //CASE: Token valid.
      //Check is user exists.
      const user_result = await DB.query(
        "SELECT * FROM users WHERE username=$1;",
        [claim.username]
      ).catch((err) => {
        return res.status(500).send({
          message: "error",
          error: {
            type: "database",
            from: "user_result",
            code: err.code,
            detail: err.detail,
            info: err,
          },
        });
      });
      if (!user_result.rows[0]) {
        //CASE: User not exists.
        res.cookie("jwt", "", { maxAge: 0 });
        return res
          .status(401)
          .status({ message: "error", error: "Unauthorized" });
      }
      const user = user_result.rows[0];
      //Check is user is an agent?
      const agent_result = await DB.query(
        "SELECT * FROM agents WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        return res.status(500).send({
          message: "error",
          error: {
            type: "database",
            from: "agent_result",
            code: err.code,
            detail: err.detail,
            info: err,
          },
        });
      });
      const agent = agent_result.rows[0];
      if (agent) {
        //CASE: user is an agent
        //Check is added user is exist?
        const add_user_result = await DB.query(
          "SELECT * FROM users WHERE username=$1;",
          [req.body.username]
        ).catch((err) => {
          return res.status(500).send({
            message: "error",
            error: {
              type: "database",
              from: "add_user_result",
              code: err.code,
              detail: err.detail,
              info: err,
            },
          });
        });
        //Check is added user is an admin account.
        const admin_result = await DB.query(
          "SELECT username FROM agents WHERE username=$1 UNION SELECT username FROM webmasters WHERE username=$2;",
          [req.body.username, req.body.username]
        ).catch((err) => {
          return res.status(500).send({
            message: "error",
            error: {
              type: "database",
              from: "admin_result",
              code: err.code,
              detail: err.detail,
              info: err,
            },
          });
        });
        if (add_user_result.rows[0] && !admin_result.rows[0]) {
          //CASE: Added user exists and not an admin.
          const add_user = add_user_result.rows[0].username;
          const agent_id = agent_result.rows[0].agent_id;
          //Check if added user already have an agent?
          const is_have_agent_result = await DB.query(
            "SELECT * FROM agent_customers WHERE username=$1;",
            [add_user]
          ).catch((err) => {
            return res.status(500).send({
              message: "error",
              error: {
                type: "database",
                from: "is_have_agent_result",
                code: err.code,
                detail: err.detail,
                info: err,
              },
            });
          });
          if (is_have_agent_result.rows[0]) {
            //CASE: Already has an agent.
            return res.status(400).send({
              message: "error",
              error: "Customer already has an agent.",
            });
          } else {
            //CASE: No agent assigned.
            await DB.query(
              "INSERT INTO agent_customers (username, agent_id) VALUES ($1, $2);",
              [add_user, agent_id]
            )
              .then((insert_agent_customers_result) => {
                return res.status(201).send({ message: "success" });
              })
              .catch((err) => {
                return res.status(500).send({
                  message: "error",
                  error: {
                    type: "database",
                    from: "insert_agent_customers_result",
                    code: err.code,
                    detail: err.detail,
                    info: err,
                  },
                });
              });
          }
        } else {
          if (!add_user_result.rows[0]) {
            //CASE: Added user not exists.
            return res.status(400).send({
              message: "error",
              error: "Username does not exist.",
            });
          }
          if (admin_result.rows[0]) {
            //CASE: Added user is an admin.
            return res.status(400).send({
              message: "error",
              error: "This account cannot be added.",
            });
          }
        }
      } else {
        //CASE: User is not an agent.
        return res
          .status(401)
          .send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      //CASE: No Token.
      return res.status(401).send({ message: "error", error: "Unauthorized" });
    }
    //CASE: Server error
    console.error(err);
    res.status(500).send({
      message: "error",
      error: {
        type: "server",
        stack: err.stack,
      },
    });
  }
});
// [GET] : Get customer's properties.
router.get("/properties/:customer", async (req, res) => {
  try {
    //Check required information.
    if (!req.params.customer) {
      return res.status(400).send({
        message: "success",
        error: "Bad request.",
      });
    }
    const customer = req.params.customer;
    //Get Token.
    const cookie = req.cookies["jwt"];
    //Verify Token.
    const claim = jwt.verify(cookie, process.env.SECRET);
    //Check is token invalid?
    if (!claim) {
      //CASE: Token is invalid.
      return res.status(401).send({
        message: "error",
        error: "Unauthorized",
      });
    } else {
      //CASE: Token is valid.
      //Check user exists?
      const user_result = await DB.query(
        "SELECT * FROM users WHERE username=$1; ",
        [claim.username]
      ).catch((err) => {
        return res.status(500).send({
          message: "error",
          error: {
            type: "database",
            from: "user_result",
            code: err.code,
            detail: err.detail,
            info: err,
          },
        });
      });
      if (!user_result.rows[0]) {
        //CASE: User not exists.
        res.cookie("jwt", "", { maxAge: 0 });
        return res.status(401).status({
          message: "error",
          error: "Unauthorized",
        });
      } else {
        const user = user_result.rows[0];
        //Check user is an agent?
        const agent_result = await DB.query(
          "SELECT * FROM agents WHERE username=$1;",
          [user.username]
        ).catch((err) => {
          return res.status(500).send({
            message: "error",
            error: {
              type: "database",
              from: "agent_result",
              code: err.code,
              detail: err.detail,
              info: err,
            },
          });
        });
        const agent = agent_result.rows[0];
        if (agent) {
          //CASE: User is an agent.
          //Check if customer has the user as their agent?
          const agent_customers_result = await DB.query(
            "SELECT * FROM agent_customers WHERE agent_id=$1 AND username=$2;",
            [agent.agent_id, customer]
          ).catch((err) => {
            return res.status(500).send({
              message: "error",
              error: {
                type: "database",
                from: "agent_customers_result",
                code: err.code,
                detail: err.detail,
                info: err,
              },
            });
          });
          if (agent_customers_result.rows[0]) {
            //CASE: User is customer's agent.
            await DB.query(
              "SELECT property_id, property_name, status, is_favorite, timestamp FROM history INNER JOIN properties USING(property_id) WHERE username=$1 ORDER BY timestamp DESC;",
              [customer]
            )
              .then((properties_result) => {
                return res.status(200).send({
                  message: "success",
                  payload: properties_result.rows,
                });
              })
              .catch((err) => {
                return res.status(500).send({
                  message: "error",
                  error: {
                    type: "database",
                    from: "properties_result",
                    code: err.code,
                    detail: err.detail,
                    info: err,
                  },
                });
              });
          } else {
            //CASE: User is not customer's agent.
            res.status(400).send({
              message: "error",
              error: "You are not an agent of this customer.",
            });
          }
        }
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      //CASE: No token.
      return res.status(401).send({
        message: "error",
        error: "Unauthorized",
      });
    }
    //CASE: Server error.
    console.error(err);
    res.status(500).send({
      message: "error",
      error: {
        type: "server",
        stack: err.stack,
      },
    });
  }
});

module.exports = router;
