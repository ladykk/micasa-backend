const router = require("express").Router();
const DB = require("../db");
const Property = require("../models/property");
const UserTools = require("../tools/UserTools");
const CustomError = require("../tools/CustomError");
const { JsonWebTokenError } = require("jsonwebtoken");

// Customers' functions.

// [GET] : /favorite_properties/
router.get("/favorite_properties/", async (req, res) => {
  /*
      DO: Get a list of favorite properties of customer.
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
    //Check is user a customer.
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //CASE: User found.
      //Query properties that favorite.
      await DB.query(
        "SELECT * FROM history INNER JOIN properties USING(property_id) WHERE customer_id=$1 AND is_favorite=true ORDER BY timestamp DESC;",
        [customer.customer_id]
      )
        .then((properties_result) => {
          return res.status(200).send({
            message: "success",
            payload: properties_result.rows.map((property) =>
              Property.property(property)
            ),
          });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "properties_result");
        });
    } else {
      //CASE: Not customer.
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
// [GET] : /favorite_property/:property_id
router.get("/favorite_property/:property_id", async (req, res) => {
  /*
      DO: Get is customer favorite this property.
  */
  try {
    //Check required information.
    if (!req.params.property_id) {
      throw new CustomError.BadRequest();
    }
    const property_id = req.params.property_id;
    //Check Authorized.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      //CASE: User not found.
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //CASE: User found.
      //Query is property favorite.
      const favorite_result = await DB.query(
        "SELECT is_favorite FROM history WHERE customer_id=$1 AND property_id=$2;",
        [customer.customer_id, property_id]
      ).catch((err) => {
        throw new CustomError.DBError(err, "favorite_result");
      });
      if (favorite_result.rows[0]) {
        //CASE: Found in history
        const is_favorite = favorite_result.rows[0].is_favorite;
        return res
          .status(200)
          .send({ message: "success", payload: is_favorite });
      } else {
        //CASE: Not found in history
        return res.status(200).send({ message: "success", payload: false });
      }
    } else {
      //CASE: Not a customer.
      return res.status(200).send({ message: "success", payload: false });
    }
  } catch (err) {
    if (
      err instanceof JsonWebTokenError ||
      err instanceof CustomError.Unauthorized
    ) {
      return res.status(200).send({ message: "success", payload: false });
    } else {
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
  }
});
// [POST] : /favorite_property/:property_id
router.post("/favorite_property/:property_id", async (req, res) => {
  /* 
      DO: Set customer's favorite on property.
  */
  try {
    //Check required information.
    if (!req.params.property_id && req.body.is_favorite) {
      //CASE: Missing some information
      throw new CustomError.BadRequest();
    }
    const property_id = req.params.property_id;
    const is_favorite = req.body.is_favorite === "true" ? true : false;
    //Check Authorization
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new Unauthorized();
    }
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //Check if property exist?
      const property_exist_result = await DB.query(
        "SELECT property_id FROM properties WHERE property_id=$1",
        [property_id]
      ).catch((err) => {
        throw new CustomError.DBError(err, "property_exist_result");
      });
      if (property_exist_result.rows[0]) {
        //CASE: Property exists.
        //Check is property in history.
        const history_result = await DB.query(
          "SELECT * FROM history WHERE customer_id=$1 AND property_id=$2;",
          [customer.customer_id, property_id]
        ).catch((err) => {
          throw new CustomError.DBError(err, "history_result");
        });
        if (history_result.rows[0]) {
          //CASE: Property is in history.
          //Update history favorite on the property.
          await DB.query(
            "UPDATE history SET is_favorite=$1, timestamp=CURRENT_TIMESTAMP WHERE customer_id=$2 AND property_id=$3;",
            [is_favorite, customer.customer_id, property_id]
          )
            .then((update_favorite_result) => {
              return res.status(201).send({
                message: "success",
                payload: is_favorite,
              });
            })
            .catch((err) => {
              throw new CustomError.DBError(err, "update_favorite_result");
            });
        } else {
          //CASE: Property is not in history.
          //Add history and favorite on the property.
          await DB.query(
            "INSERT INTO history (property_id, customer_id, is_favorite) VALUES ($1, $2, $3);",
            [property_id, customer.customer_id, is_favorite]
          ).catch((err) => {
            throw new CustomError.BadRequest(err, "insert_favorite_result");
          });
          await DB.query(
            "UPDATE properties SET seen=(SELECT seen + 1 FROM properties WHERE property_id=$1) WHERE property_id=$1;",
            [property_id]
          ).catch((err) => {
            throw new CustomError.DBError(err, "update_seen_result");
          });
          return res.status(201).send({
            message: "success",
            payload: is_favorite,
          });
        }
      } else {
        //CASE: Property not found.
        throw new CustomError.BadRequest("Property not found.");
      }
    } else {
      //CASE: Not a customer.
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
// [GET] : /agent/
router.get("/agent/", async (req, res) => {
  /*
      DO: Get agent's detail.
  */
  try {
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new Unauthorized();
    }
    //Check is user is a customer.
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //CASE: User found && a customer.
      //Check is has agent.
      if (customer.agent) {
        //CASE: Has Agent.
        //Query agents.
        await DB.query(
          "SELECT agent_id, full_name, email, phone_number, avatar_id FROM users NATURAL JOIN agents WHERE agent_id=$1",
          [customer.agent]
        )
          .then((agent_result) => {
            return res.status(200).send({
              message: "success",
              payload: agent_result.rows[0],
            });
          })
          .catch((err) => {
            throw new CustomError.DBError(err, "agent_result");
          });
      } else {
        //CASE: No Agent.
        //Return null.
        return res.status(200).send({
          message: "success",
          payload: null,
        });
      }
    } else {
      //CASE: Not customer.
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
