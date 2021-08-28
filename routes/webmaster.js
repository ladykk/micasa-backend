const router = require("express").Router();
const DB = require("../db");
const jwt = require("jsonwebtoken");

//Approve Properties
router.get("/approve", async (req, res) => {
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
      const user = user_result.rows[0];

      //Check is user is webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      const webmaster = webmaster_result.rows[0];

      if (webmaster) {
        const pending_properties = await DB.query(
          "SELECT property_id, property_name, status FROM properties WHERE status='Pending' ORDER BY property_id;"
        )
          .then((result) => {
            res.status(200).send(result.rows);
          })
          .catch((err) => {
            res.status(500).send({
              message: "error",
              error: { code: err.code, detailL: err.detail },
              full_error: err,
            });
          });
      } else {
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send({ message: "error", error: "Unauthorized" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});
router.patch("/approve", async (req, res) => {
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
      const user = user_result.rows[0];

      //Check is user is webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      const webmaster = webmaster_result.rows[0];

      if (webmaster) {
        await DB.query(
          "UPDATE properties SET status=$1 WHERE property_id=$2;",
          [req.body.status, req.body.property_id]
        )
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
      } else {
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send({ message: "error", error: "Unauthorized" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});

//Get Agents
router.get("/agents/", async (req, res) => {
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
        "SELECT * FROM users WHERE username=$1; ",
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
      const user = user_result.rows[0];

      //Check is user is webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      const webmaster = webmaster_result.rows[0];

      if (webmaster) {
        const agents_result = await DB.query(
          "SELECT agent_id, users.username as username, avatar_id, full_name, email, phone_number, gender, birthday, webmasters.username as add_by FROM users INNER JOIN agents using(username) INNER JOIN webmasters ON agents.add_by = webmasters.webmaster_id ORDER BY agent_id DESC;"
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
          return;
        });
        if (agents_result.rows) {
          res.status(200).send({
            message: "success",
            payload: agents_result.rows,
          });
        }
      } else {
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send({ message: "error", error: "Unauthorized" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});
//Add agent
router.post("/agents/add", async (req, res) => {
  try {
    if (!req.body.username) {
      res.status(400).send({ message: "error", error: "Bad request." });
      return;
    }
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
      const user = user_result.rows[0];

      //Check is user is webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      const webmaster = webmaster_result.rows[0];

      if (webmaster) {
        //Check is added username is exist
        const add_user_result = await DB.query(
          "SELECT * FROM users WHERE username=$1;",
          [req.body.username]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
          return;
        });
        if (add_user_result.rows[0]) {
          const add_user = add_user_result.rows[0].username;
          await DB.query(
            "INSERT INTO agents (username, add_by) VALUES ($1, $2);",
            [add_user, webmaster.webmaster_id]
          )
            .then((result) => {
              res.status(201).send({ message: "success" });
            })
            .catch((err) => {
              res.status(500).send({
                message: "error",
                error: { code: err.code, detailL: err.detail },
                full_error: err,
              });
              return;
            });
        } else {
          res
            .status(400)
            .send({ message: "error", error: "Username does not exist." });
        }
      } else {
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send({ message: "error", error: "Unauthorized" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});
//Remove agent
router.delete("/agents/remove/:username", async (req, res) => {
  try {
    if (!req.params.username) {
      res.status(400).send({ message: "error", error: "Bad request." });
    }
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
        "SELECT * FROM users WHERE username=$1; ",
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
      const user = user_result.rows[0];

      //Check is user is webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      const webmaster = webmaster_result.rows[0];

      if (webmaster) {
        const agents_result = await DB.query(
          "DELETE FROM agents WHERE username=$1",
          [req.params.username]
        )
          .then((result) => {
            res.status(201).send({ message: "success" });
          })
          .catch((err) => {
            res.status(500).send({
              message: "error",
              error: { code: err.code, detailL: err.detail },
              full_error: err,
            });
            return;
          });
      } else {
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send({ message: "error", error: "Unauthorized" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});

//Get customer
router.get("/customers/:agent_id", async (req, res) => {
  try {
    if (!req.params.agent_id) {
      res.status(400).send({ message: "error", error: "Bad request." });
    }
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
        "SELECT * FROM users WHERE username=$1; ",
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
      const user = user_result.rows[0];

      //Check is user is webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      const webmaster = webmaster_result.rows[0];

      if (webmaster) {
        const agent_customers = await DB.query(
          "SELECT users.username as username, avatar_id, full_name FROM users INNER JOIN agent_customers USING(username) WHERE agent_id = $1;",
          [req.params.agent_id]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
          return;
        });
        if (agent_customers.rows) {
          res.status(200).send({
            message: "success",
            payload: agent_customers.rows,
          });
        }
      } else {
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send({ message: "error", error: "Unauthorized" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});
//Add Customer
router.post("/customers/add", async (req, res) => {
  try {
    if (!req.body.username && !req.body.agent_username) {
      res.status(400).send({ message: "error", error: "Bad request." });
      return;
    }
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
      const user = user_result.rows[0];

      //Check is user is webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      const webmaster = webmaster_result.rows[0];

      if (webmaster) {
        //Check is added username is exist
        const add_user_result = await DB.query(
          "SELECT * FROM users WHERE username=$1;",
          [req.body.username]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
          return;
        });
        //Check is agent_id is exist.
        const agent_result = await DB.query(
          "SELECT * FROM agents WHERE username=$1;",
          [req.body.agent_username]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
          return;
        });
        //Check is user is admin account.
        const admin_result = await DB.query(
          "SELECT username FROM agents WHERE username=$1 UNION SELECT username FROM webmasters WHERE username=$2;",
          [req.body.username, req.body.username]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
          return;
        });
        if (
          add_user_result.rows[0] &&
          agent_result.rows[0] &&
          !admin_result.rows[0]
        ) {
          const add_user = add_user_result.rows[0].username;
          const agent_id = agent_result.rows[0].agent_id;
          const is_customer_exist_result = await DB.query(
            "SELECT * FROM agent_customers WHERE username=$1;",
            [add_user]
          ).catch((err) => {
            res.status(500).send({
              message: "error",
              error: { code: err.code, detailL: err.detail },
              full_error: err,
            });
            return;
          });
          if (is_customer_exist_result.rows[0]) {
            await DB.query(
              "UPDATE agent_customers SET agent_id=$1 WHERE username=$2;",
              [agent_id, add_user]
            )
              .then((result) => {
                res.status(201).send({ message: "success" });
              })
              .catch((err) => {
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
                return;
              });
          } else {
            await DB.query(
              "INSERT INTO agent_customers (username, agent_id) VALUES ($1, $2);",
              [add_user, agent_id]
            )
              .then((result) => {
                res.status(201).send({ message: "success" });
              })
              .catch((err) => {
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
                return;
              });
          }
        } else {
          if (!add_user_result.rows[0]) {
            res
              .status(400)
              .send({ message: "error", error: "Username does not exist." });
            return;
          }
          if (!agent_result.rows[0]) {
            res
              .status(400)
              .send({ message: "error", error: "Agent does not exist." });
            return;
          }
          if (admin_result.rows[0]) {
            res
              .status(400)
              .send({
                message: "error",
                error: "This account cannot be added.",
              });
          }
        }
      } else {
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send({ message: "error", error: "Unauthorized" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});
//Remove customer
router.delete("/customers/remove/:username", async (req, res) => {
  try {
    if (!req.params.username) {
      res.status(400).send({ message: "error", error: "Bad request." });
    }
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
        "SELECT * FROM users WHERE username=$1; ",
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
      const user = user_result.rows[0];

      //Check is user is webmaster
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [user.username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      const webmaster = webmaster_result.rows[0];

      if (webmaster) {
        await DB.query("DELETE FROM agent_customers WHERE username=$1", [
          req.params.username,
        ])
          .then((result) => {
            res.status(201).send({ message: "success" });
          })
          .catch((err) => {
            res.status(500).send({
              message: "error",
              error: { code: err.code, detailL: err.detail },
              full_error: err,
            });
            return;
          });
      } else {
        res.status(401).send({ message: "error", error: "Unauthorized" });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send({ message: "error", error: "Unauthorized" });
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});

module.exports = router;
