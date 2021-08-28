const router = require("express").Router();
const DB = require("../db");
const jwt = require("jsonwebtoken");
const Property = require("../models/property");

// Customers' functions.
// [GET] : Get customer's favorite properties.
router.get("/favorite_properties/", async (req, res) => {
  try {
    //Get Token.
    const cookie = req.cookies["jwt"];
    //Verify Token.
    const claim = jwt.verify(cookie, process.env.SECRET);
    if (claim) {
      //CASE: Token valid.
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
      if (user_result.rows[0]) {
        //CASE: User found.
        const username = user_result.rows[0].username;
        await DB.query(
          "SELECT * FROM history INNER JOIN properties USING(property_id) WHERE username=$1 AND is_favorite=true ORDER BY timestamp DESC;",
          [username]
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
        //CASE: User not found.
        return res.status(401).send({
          message: "error",
          error: "Unauthorized.",
        });
      }
    } else {
      //CASE: Token invalid.
      return res.status(401).send({
        message: "error",
        error: "Unauthorized.",
      });
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      //CASE: No token.
      res.status(401).send({ message: "error", error: "Unauthorized" });
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
// [GET] : Get customer's favorite property.
router.get("/favorite_property/:property_id", async (req, res) => {
  try {
    //Check required information.
    if (!req.params.property_id) {
      return res.status(400).send({ message: "error", error: "Bad request." });
    }
    const property_id = req.params.property_id;
    //Get Token.
    const cookie = req.cookies["jwt"];
    //Verify Token.
    const claim = jwt.verify(cookie, process.env.SECRET);
    if (claim) {
      //CASE: Token valid.
      //Check is user exists?
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
      if (user_result.rows[0]) {
        //CASE: User found.
        const username = user_result.rows[0].username;
        const favorite_result = await DB.query(
          "SELECT is_favorite FROM history WHERE username=$1 AND property_id=$2;",
          [username, property_id]
        ).catch((err) => {
          return res.status(500).send({
            message: "error",
            error: {
              type: "database",
              from: "favorite_result",
              code: err.code,
              detail: err.detail,
              info: err,
            },
          });
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
        //CASE: User not found.
        return res.status(401).send({
          message: "error",
          error: "Unauthorized.",
        });
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      //CASE: No token.
      return res.status(200).send({
        message: "success",
        payload: false,
      });
    } else if (err instanceof TypeError) {
      //CASE: No token.
      return res.status(200).send({
        message: "success",
        payload: false,
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
// [POST] : Set customer's favorite on property.
router.post("/favorite_property/:property_id", async (req, res) => {
  try {
    //Check required information.
    if (!req.params.property_id && req.body.is_favorite) {
      //CASE: Missing some information
      return res.status(400).send({ message: "error", error: "Bad request." });
    }
    const property_id = req.params.property_id;
    const is_favorite = req.body.is_favorite === "true" ? true : false;
    //Get Token.
    const cookie = req.cookies["jwt"];
    //Verify Token.
    const claim = jwt.verify(cookie, process.env.SECRET);
    if (claim) {
      //CASE: Token valid.
      //Check is user exists?
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
      if (user_result.rows[0]) {
        //CASE: User exist.
        const username = user_result.rows[0].username;
        //Check if property exist?
        const property_exist_result = await DB.query(
          "SELECT property_id FROM properties WHERE property_id=$1",
          [property_id]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
        });
        if (property_exist_result.rows[0]) {
          //CASE: Property exists.
          //Check is property in history.
          const history_result = await DB.query(
            "SELECT * FROM history WHERE username=$1 AND property_id=$2;",
            [username, property_id]
          ).catch((err) => {
            return res.status(500).send({
              message: "error",
              error: {
                type: "database",
                from: "history_result",
                code: err.code,
                detail: err.detail,
                info: err,
              },
            });
          });
          if (history_result.rows[0]) {
            //CASE: Property is in history.
            await DB.query(
              "UPDATE history SET is_favorite=$1, timestamp=CURRENT_TIMESTAMP WHERE username=$2 AND property_id=$3;",
              [is_favorite, username, property_id]
            )
              .then((update_favorite_result) => {
                return res.status(201).send({
                  message: "success",
                  payload: is_favorite,
                });
              })
              .catch((err) => {
                return res.status(500).send({
                  message: "error",
                  error: {
                    type: "database",
                    from: "update_favorite_result",
                    code: err.code,
                    detail: err.detail,
                    info: err,
                  },
                });
              });
          } else {
            //CASE: Property is not in history.
            await DB.query(
              "INSERT INTO history (property_id, username, is_favorite) VALUES ($1, $2, $3);",
              [req.params.property_id, username, is_favorite]
            ).catch((err) => {
              return res.status(500).send({
                message: "error",
                error: {
                  type: "database",
                  from: "insert_history_result",
                  code: err.code,
                  detail: err.detail,
                  info: err,
                },
              });
            });
            await DB.query(
              "UPDATE properties SET seen=(SELECT seen + 1 FROM properties WHERE property_id=$1) WHERE property_id=$1;",
              [req.params.property_id]
            ).catch((err) => {
              return res.status(500).send({
                message: "error",
                error: {
                  type: "database",
                  from: "update_property_result",
                  code: err.code,
                  detail: err.detail,
                  info: err,
                },
              });
            });
            return res.status(201).send({
              message: "success",
              payload: is_favorite,
            });
          }
        } else {
          //CASE: Property not found.
          return res.status(404).send({
            message: "error",
            error: "Property not found.",
          });
        }
      } else {
        //CASE: User not found.
        return res.status(401).send({
          message: "error",
          error: "Unauthorized.",
        });
      }
    } else {
      //CASE: Token invalid.
      return res.status(401).send({
        message: "success",
        error: "Unauthorized.",
      });
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      //CASE: No token.
      return res.status(401).send({ message: "error", error: "Unauthorized." });
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

module.exports = router;
