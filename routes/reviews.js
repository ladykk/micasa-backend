require("dotenv/config");
const router = require("express").Router();
const DB = require("../db");
const UserTools = require("../tools/UserTools");
const CustomError = require("../tools/CustomError");

// [GET] : /
router.get("/", async (req, res) => {
  /*
      DO: Get latest 10 reviews.
  */
  try {
    //Query reviews.
    await DB.query(
      "SELECT full_name, avatar_id, rate, message FROM reviews NATURAL JOIN properties NATURAL JOIN customers NATURAL JOIN users WHERE message IS NOT NULL AND rate IS NOT NULL ORDER BY timestamp DESC LIMIT 10;"
    )
      .then((reviews_result) => {
        return res.status(200).send({
          message: "success",
          payload: reviews_result.rows,
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "reviews_result");
      });
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
// [GET] : /pending
router.get("/pending", async (req, res) => {
  /*
      DO: Get pending review of the user.
  */
  try {
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    //Check is customer.
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //CASE: Found customer
      //Query pending review of customer.
      await DB.query(
        "SELECT property_name, property_id, image_cover, role FROM reviews NATURAL JOIN properties WHERE message IS NULL AND rate IS NULL;"
      )
        .then((reviews_result) => {
          return res.status(200).send({
            message: "success",
            payload: reviews_result.rows,
          });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "reviews_result");
        });
    } else {
      //CASE: Not found customer
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
// [POST] : /pending
router.post("/pending", async (req, res) => {
  /*
      DO: Update pending review.
  */
  try {
    //Check required information.
    if (!req.body.property_id || !req.body.rate || !req.body.message) {
      throw new CustomError.BadRequest();
    }
    const property_id = Number.parseInt(req.body.property_id, 10);
    const rate = Number.parseInt(req.body.rate, 10);
    const message = req.body.message;
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    //Check is customer.
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //CASE: Found customer
      //Update review
      await DB.query(
        "UPDATE reviews SET rate=$1, message=$2, timestamp=CURRENT_TIMESTAMP WHERE customer_id=$3 AND property_id=$4 RETURNING *;",
        [rate, message, customer.customer_id, property_id]
      )
        .then((update_reviews_result) => {
          if (update_reviews_result.rows[0]) {
            //CASE: Review is found and update.
            return res.status(201).send({
              message: "success",
            });
          } else {
            //CASE: Review is not found.
            throw new CustomError.Unauthorized(
              "User cannot review this property."
            );
          }
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "reviews_result");
        });
    } else {
      //CASE: Not found customer
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
// [GET] : /history
router.get("/history", async (req, res) => {
  /*
      DO: Get history reviews of the user.
  */
  try {
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0, secure: false });
      throw new CustomError.Unauthorized();
    }
    //Check is customer.
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //CASE: Found customer
      await DB.query(
        "SELECT property_name, property_id, image_cover, role, rate, message, timestamp FROM reviews NATURAL JOIN properties WHERE message IS NOT NULL AND rate IS NOT NULL;"
      )
        .then((reviews_result) => {
          return res.status(200).send({
            message: "success",
            payload: reviews_result.rows,
          });
        })
        .catch((err) => {
          throw new CustomError.DBError(err, "reviews_result");
        });
    } else {
      //CASE: Not found customer
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
