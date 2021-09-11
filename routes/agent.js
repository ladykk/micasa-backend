const router = require("express").Router();
const DB = require("../db");
const UserTools = require("../tools/UserTools");
const CustomError = require("../tools/CustomError");

// Agents' functions

// [GET] : /customers
router.get("/customers/", async (req, res) => {
  /*
      DO: Return a list of customers of the agent.
      ERROR:  1. Unauthorized.
              2. DBError.
  */

  try {
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      //CASE: User not found.
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const agent = await UserTools.checkIsAgent(user.username);
    if (agent) {
      //CASE: User is an agent.
      /*
          Retrieve: customer_id, username, full_name, email, phone_number, gender, birthday, avatar_id;
      */
      await DB.query(
        "SELECT customer_id, users.username AS username, full_name, email, phone_number, gender, birthday, avatar_id FROM users INNER JOIN customers USING(username) WHERE agent = $1;",
        [agent.agent_id]
      )
        .then((customers_result) => {
          return res.status(200).send({
            message: "success",
            payload: customers_result.rows,
          });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "customers_result");
        });
    } else {
      //CASE: User is not an agent.
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
      DO: Update customer's agent to be the agent.
      ERROR:  1. Bad Request
              2. Unauthorized
  */
  try {
    //Check required information
    if (!req.body.username && !req.body.agent_username) {
      //CASE: Missing some information.
      throw new CustomError.BadRequest();
    }
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      //CASE: User not found.
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    //Check is an agent
    const agent = await UserTools.checkIsAgent(user.username);
    if (agent) {
      //CASE: user is an agent
      //Check is added user is exist?
      const add_user = await UserTools.validateUser(req.body.username);
      //Check is added user is customer.
      const customer = await UserTools.checkIsCustomer(add_user.username);
      if (add_user) {
        //CASE: Add User found.
        if (!customer) {
          //CASE: User is not a customer.
          throw new CustomError.BadRequest("This account cannot be added.");
        } else {
          //CASE: Added user exists and not an staff.
          if (customer.agent) {
            //CASE: Already has an agent.
            throw new CustomError.BadRequest("Customer already has an agent.");
          } else {
            //CASE: No agent assigned.
            //Update agent of customer.
            await DB.query("UPDATE customers SET agent=$1 WHERE username=$2;", [
              agent.agent_id,
              add_user.username,
            ])
              .then((update_customer_result) => {
                return res.status(201).send({ message: "success" });
              })
              .catch((err) => {
                throw new CustomError.DBError(err, "update_customer_result");
              });
          }
        }
      } else {
        //CASE: Add User not found.
        throw new CustomError.BadRequest("User not found.");
      }
    } else {
      //CASE: User is not an agent.
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
// [GET] : /properties/:customer
router.get("/properties/:customer", async (req, res) => {
  /*
      DO: Get a list of properties' history of customer.
      ERROR:  1. Bad Request
              2. Unauthorized
              3. DBError
  */
  try {
    //Check required information.
    if (!req.params.customer) {
      throw new CustomError.BadRequest();
    }
    const customer = req.params.customer;
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const agent = await UserTools.checkIsAgent(user.username);
    if (agent) {
      //CASE: User is an agent.
      //Check if customer has the user as their agent?
      const customers_result = await DB.query(
        "SELECT customer_id FROM customers WHERE agent=$1 AND username=$2;",
        [agent.agent_id, customer]
      ).catch((err) => {
        throw new CustomError.DBError(err, "customers_result");
      });
      if (customers_result.rows[0]) {
        //CASE: User is customer's agent.
        //Get properties' history of customer.
        const customer_id = customers_result.rows[0].customer_id;
        await DB.query(
          "SELECT property_id, property_name, status, is_favorite, timestamp FROM history INNER JOIN properties USING(property_id) WHERE customer_id=$1 ORDER BY timestamp DESC;",
          [customer_id]
        )
          .then((properties_result) => {
            return res.status(200).send({
              message: "success",
              payload: properties_result.rows,
            });
          })
          .catch((err) => {
            throw new CustomError.DBError(err, "properties_result");
          });
      } else {
        //CASE: Not agent of this customer.
        throw new CustomError.BadRequest(
          "You are not the agent of this customer."
        );
      }
    } else {
      //CASE: User is not an agent.
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
