const router = require("express").Router();
const DB = require("../db");
const CustomError = require("../tools/CustomError");

// [GET] - /district
router.get("/district", async (req, res) => {
  /*
      DO: Get district enum.
  */
  try {
    //Query district enum.
    await DB.query("SELECT unnest(enum_range(NULL::district));")
      .then((district) => {
        return res.status(200).send({
          message: "success",
          payload: district.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "district");
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

// [GET] - /province
router.get("/province", async (req, res) => {
  /*
      DO: Get province enum.
  */
  try {
    //Query province enum.
    await DB.query("SELECT unnest(enum_range(NULL::province));")
      .then((province) => {
        return res.status(200).send({
          message: "success",
          payload: province.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "province");
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

// [GET] - /bathroom
router.get("/bathroom", async (req, res) => {
  /*
      DO: Get bathroom enum.
  */
  try {
    //Query bathroom enum.
    await DB.query("SELECT unnest(enum_range(NULL::property_bathroom));")
      .then((bathroom) => {
        return res.status(200).send({
          message: "success",
          payload: bathroom.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "bathroom");
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

// [GET] - /bedroom
router.get("/bedroom", async (req, res) => {
  /*
      DO: Get bedroom enum.
  */
  try {
    //Query bedroom enum.
    await DB.query("SELECT unnest(enum_range(NULL::property_bedroom));")
      .then((bedroom) => {
        return res.status(200).send({
          message: "success",
          payload: bedroom.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "bedroom");
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

// [GET] - /contract
router.get("/contract", async (req, res) => {
  /*
      DO: Get contract enum.
  */
  try {
    //Query contract enum;
    await DB.query("SELECT unnest(enum_range(NULL::property_contract));")
      .then((contract) => {
        return res.status(200).send({
          message: "success",
          payload: contract.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "contract");
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

// [GET] - /furnishing
router.get("/furnishing", async (req, res) => {
  /*
      DO: Get furnishing enum.
  */
  try {
    //Query furnishing enum.
    await DB.query("SELECT unnest(enum_range(NULL::property_furnishing));")
      .then((furnishing) => {
        return res.status(200).send({
          message: "success",
          payload: furnishing.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "furnishing");
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

// [GET] - /near_station
router.get("/near_station", async (req, res) => {
  /*
      DO: Get near_station enum.
  */
  try {
    //Query near_station enum.
    await DB.query("SELECT unnest(enum_range(NULL::property_near_station));")
      .then((near_station) => {
        return res.status(200).send({
          message: "success",
          payload: near_station.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "near_station");
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

// [GET] - /ownership
router.get("/ownership", async (req, res) => {
  /*
      DO: Get ownership enum.
  */
  try {
    //Query ownership enum.
    await DB.query("SELECT unnest(enum_range(NULL::property_ownership));")
      .then((ownership) => {
        return res.status(200).send({
          message: "success",
          payload: ownership.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "ownership");
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

// [GET] - /rent_payment
router.get("/rent_payment", async (req, res) => {
  /*
      DO: Get rent_payment enum.
  */
  try {
    //Query rent_payment enum.
    await DB.query("SELECT unnest(enum_range(NULL::property_rent_payment));")
      .then((rent_payment) => {
        return res.status(200).send({
          message: "success",
          payload: rent_payment.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "rent_payment");
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

// [GET] - /status
router.get("/status", async (req, res) => {
  /*
      DO: Get status enum.
  */
  try {
    //Query status enum.
    await DB.query("SELECT unnest(enum_range(NULL::property_status));")
      .then((status) => {
        return res.status(200).send({
          message: "success",
          payload: status.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "status");
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

// [GET] - /type
router.get("/type", async (req, res) => {
  /*
      DO: Get type enum.
  */
  try {
    //Query type enum.
    await DB.query("SELECT unnest(enum_range(NULL::property_type));")
      .then((type) => {
        return res.status(200).send({
          message: "success",
          payload: type.rows.map((data) => data.unnest),
        });
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "type");
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

module.exports = router;
