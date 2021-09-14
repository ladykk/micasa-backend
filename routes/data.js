const router = require("express").Router();
const DB = require("../db");
const CustomError = require("../tools/CustomError");

// [GET] - Get district.
router.get("/district", async (req, res) => {
  try {
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

// [GET] - Get province.
router.get("/province", async (req, res) => {
  try {
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

// [GET] - Get bathroom.
router.get("/bathroom", async (req, res) => {
  try {
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

// [GET] - Get bedroom.
router.get("/bedroom", async (req, res) => {
  try {
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

// [GET] - Get contract.
router.get("/contract", async (req, res) => {
  try {
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

// [GET] - Get furnishing.
router.get("/furnishing", async (req, res) => {
  try {
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

// [GET] - Get near_station.
router.get("/near_station", async (req, res) => {
  try {
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

// [GET] - Get ownership.
router.get("/ownership", async (req, res) => {
  try {
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

// [GET] - Get rent_payment.
router.get("/rent_payment", async (req, res) => {
  try {
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

// [GET] - Get status.
router.get("/status", async (req, res) => {
  try {
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

// [GET] - Get type.
router.get("/type", async (req, res) => {
  try {
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
