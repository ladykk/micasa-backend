const router = require("express").Router();
const DB = require("../db");
const UserTools = require("../tools/UserTools");
const CustomError = require("../tools/CustomError");

//Webmaster's Function

// [GET] : /approve
router.get("/approve", async (req, res) => {
  /*
      DO: Get pending properties.
  */
  try {
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const webmaster = await UserTools.checkIsWebmaster(user.username);

    if (webmaster) {
      //CASE: User is webmaster.
      await DB.query(
        "SELECT property_id, property_name, status FROM properties WHERE status='Pending' ORDER BY property_id;"
      )
        .then((properties_result) => {
          res.status(200).send(properties_result.rows);
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "properties_result");
        });
    } else {
      //CASE: User is not a webmaster.
      throw new CustomError.Unauthorized();
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
// [POST] : /approve
router.patch("/approve", async (req, res) => {
  /*
      DO: Approve property
  */
  try {
    //Check required information
    if (!req.body.status || !req.body.property_id) {
      throw new CustomError.BadRequest();
    }
    const status = req.body.status;
    const property_id = req.body.property_id;
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const webmaster = await UserTools.checkIsWebmaster(user.username);
    if (webmaster) {
      //CASE: User is webmaster
      await DB.query("UPDATE properties SET status=$1 WHERE property_id=$2;", [
        status,
        property_id,
      ])
        .then((approve_result) => {
          res.status(201).send({ message: "success" });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "approve_result");
        });
    } else {
      //CASE: User is not webmaster.
      throw new CustomError.Unauthorized();
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
// [GET] : /agents/
router.get("/agents/", async (req, res) => {
  /*
      DO: Get agents' list.
  */
  try {
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const webmaster = await UserTools.checkIsWebmaster(user.username);
    if (webmaster) {
      await DB.query(
        "SELECT agent_id, users.username as username, avatar_id, full_name, email, phone_number, gender, birthday, webmasters.username as add_by FROM users INNER JOIN agents using(username) INNER JOIN webmasters ON agents.add_by = webmasters.webmaster_id ORDER BY agent_id DESC;"
      )
        .then((agents_result) => {
          res.status(200).send({
            message: "success",
            payload: agents_result.rows,
          });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "agents_result");
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
// [POST] : /agents/add
router.post("/agents/add", async (req, res) => {
  /*
      DO: Add agent.
  */
  try {
    //Check required information
    if (!req.body.username) {
      res.status(400).send({ message: "error", error: "Bad request." });
      return;
    }
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const webmaster = await UserTools.checkIsWebmaster(user.username);
    if (webmaster) {
      //Check is added username is exist
      const add_user = await UserTools.validateUser(req.body.username.toLowerCase()).catch(
        (err) => {}
      );
      if (add_user) {
        await DB.query(
          "INSERT INTO agents (username, add_by) VALUES ($1, $2);",
          [add_user.username, webmaster.webmaster_id]
        )
          .then((add_agent_result) => {
            res.status(201).send({ message: "success" });
          })
          .catch((err) => {
            throw new CustomError.DBError(err, "add_agent_result");
          });
      } else {
        throw new CustomError.BadRequest("Username does not exist.");
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
// [DELETE] : /agents/remove:username
router.delete("/agents/remove/:username", async (req, res) => {
  /*
      DO: Remove agent.
  */
  try {
    //Check required information.
    if (!req.params.username) {
      throw new CustomError.BadRequest();
    }
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const webmaster = await UserTools.checkIsWebmaster(user.username);
    if (webmaster) {
      await DB.query("DELETE FROM agents WHERE username=$1", [
        req.params.username,
      ])
        .then(async (remove_agent_result) => {
          await DB.query("INSERT INTO customers (username) VALUES ($1);", [
            req.params.username,
          ])
            .then((insert_customer_result) => {
              return res.status(201).send({ message: "success" });
            })
            .catch((err) => {
              throw new CustomError.DBError(err, "insert_customer_result");
            });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "remove_agent_result");
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
// [GET] : /customers/:agent_id
router.get("/customers/:agent_id", async (req, res) => {
  /*
      DO: Get customers's list of an agent.
  */
  try {
    //Check required information.
    if (!req.params.agent_id) {
      throw new CustomError.BadRequest();
    }
    //Check Authorization
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const webmaster = await UserTools.checkIsWebmaster(user.username);

    if (webmaster) {
      await DB.query(
        "SELECT username, avatar_id, full_name FROM users NATURAL JOIN customers WHERE agent = $1;",
        [req.params.agent_id]
      )
        .then((customers_agent_result) => {
          res.status(200).send({
            message: "success",
            payload: customers_agent_result.rows,
          });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "customers_result");
        });
    } else {
      throw new CustomError.Unauthorized();
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
// [POST] : /customers/add
router.post("/customers/add", async (req, res) => {
  /*
      DO: Add customer to an agent.
  */
  try {
    //Check required information.
    if (!req.body.username && !req.body.agent_username) {
      throw new CustomError.BadRequest();
    }
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const webmaster = await UserTools.checkIsWebmaster(user.username);

    if (webmaster) {
      //Check is added username is exist
      const add_user = await UserTools.validateUser(req.body.username.toLowerCase());
      if (add_user) {
        //Check is user is staff account.
        const agent = await UserTools.checkIsAgent(req.body.agent_username);
        if (agent) {
          const customer = await UserTools.checkIsCustomer(add_user.username);
          if (customer) {
            //Update agent.
            await DB.query("UPDATE customers SET agent=$1 WHERE username=$2;", [
              agent.agent_id,
              add_user.username,
            ])
              .then((update_customer_agent_result) => {
                res.status(201).send({ message: "success" });
              })
              .catch((err) => {
                throw new CustomError.DBError(
                  err,
                  "update_customer_agent_result"
                );
              });
          } else {
            throw new CustomError.BadRequest("This Account is not a customer.");
          }
        } else {
          throw new CustomError.BadRequest("Agent does not exist.");
        }
      } else {
        throw new CustomError.BadRequest("Username not found.");
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
// [DELETE] : /customers/remove/:username
router.delete("/customers/remove/:username", async (req, res) => {
  /*
      DO: Remove agent from customer.
  */
  try {
    //Check required information.
    if (!req.params.username) {
      throw new CustomError.BadRequest();
    }
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const webmaster = await UserTools.checkIsWebmaster(user.username);
    if (webmaster) {
      await DB.query("UPDATE customers SET agent=null WHERE username=$1", [
        req.params.username,
      ])
        .then((remove_customer_result) => {
          res.status(201).send({ message: "success" });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "remove_customer_result");
        });
    } else {
      throw new CustomError.Unauthorized();
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
