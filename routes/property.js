require("dotenv/config");
const router = require("express").Router();
const DB = require("../db");
const jwt = require("jsonwebtoken");
const Property = require("../models/property");

//Add Property
router.post("/add", async (req, res) => {
  try {
    let isError = false;
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
      const seller = user_result.rows[0].username;
      const new_property = Property.new_property(req.body, req.files);

      if (!new_property) {
        res.status(400).send({ message: "error", error: "Bad request" });
      } else {
        const inserted_result = await DB.query(
          "INSERT INTO properties (property_name, property_type, seller, contract, area, price, rent_payment, rent_requirement, bedroom, bathroom, district, province, near_station, maps_query, furnishing, ownership, air_conditioning, balcony, cctv, concierge, fitness, garden, library, lift, parking, playground, pet_friendly, river_view, security, single_storey, swimming_pool, sport_center, tv, wifi, description) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35) RETURNING property_id;",
          [
            new_property.property_name,
            new_property.property_type,
            seller,
            new_property.contract,
            new_property.area,
            new_property.price,
            new_property.rent_payment,
            new_property.rent_requirement,
            new_property.bedroom,
            new_property.bathroom,
            new_property.district,
            new_property.province,
            new_property.near_station,
            new_property.maps_query,
            new_property.furnishing,
            new_property.ownership,
            new_property.facilities.air_conditioning,
            new_property.facilities.balcony,
            new_property.facilities.cctv,
            new_property.facilities.concierge,
            new_property.facilities.fitness,
            new_property.facilities.garden,
            new_property.facilities.library,
            new_property.facilities.lift,
            new_property.facilities.parking,
            new_property.facilities.playground,
            new_property.facilities.pet_friendly,
            new_property.facilities.river_view,
            new_property.facilities.security,
            new_property.facilities.single_storey,
            new_property.facilities.swimming_pool,
            new_property.facilities.sport_center,
            new_property.facilities.tv,
            new_property.facilities.wifi,
            new_property.description,
          ]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
        });

        if (inserted_result.rows[0].property_id) {
          const property_id = Number.parseInt(
            inserted_result.rows[0].property_id,
            10
          );
          for (let id in new_property.images) {
            if (isError) {
              break;
            } else if (!new_property.images[id]) {
              continue;
            } else {
              const { data, name } = new_property.images[id];
              const image_result = await DB.query(
                "INSERT INTO images (file_name, data) VALUES ($1, $2) RETURNING image_id;",
                [name, data]
              ).catch((err) => {
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
                isError = true;
              });
              if (image_result.rows[0].image_id) {
                const image_id = Number.parseInt(
                  image_result.rows[0].image_id,
                  10
                );
                await DB.query(
                  `UPDATE properties SET ${id}=$1 WHERE property_id=$2`,
                  [image_id, property_id]
                ).catch((err) => {
                  res.status(500).send({
                    message: "error",
                    error: { code: err.code, detailL: err.detail },
                    full_error: err,
                  });
                  isError = true;
                });
              }
            }
          }
          if (!isError) {
            res.status(201).send({ message: "success" });
          }
        }
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

//Edit Property
router.get("/edit/:property_id", async (req, res) => {
  try {
    if (!req.params.property_id) {
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
        return res
          .status(401)
          .status({ message: "error", error: "Unauthorized" });
      }
      const seller = user_result.rows[0].username;
      const property_result = await DB.query(
        "SELECT * FROM properties WHERE property_id=$1 AND seller=$2;",
        [req.params.property_id, seller]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
      });
      if (property_result.rows[0]) {
        const property = Property.property(property_result.rows[0]);
        res.status(200).send({ message: "success", payload: property });
      } else {
        return res
          .status(401)
          .send({ message: "error", error: "Unauthorized" });
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
router.patch("/edit/:property_id", async (req, res) => {
  try {
    let isError = false;
    if (!req.params.property_id) {
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
      const seller = user_result.rows[0].username;
      const property_result = await DB.query(
        "SELECT * FROM properties WHERE property_id=$1 AND seller=$2;",
        [req.params.property_id, seller]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
      });
      if (property_result.rows[0]) {
        const property = Property.property(property_result.rows[0]);
        const status = property.status;
        switch (status) {
          case "Sold":
            res.status(401).send({
              message: "error",
              property: "Property already sold out.",
            });
          default:
        }
        const update_data = Property.update_data(req.body, req.files);
        if (update_data.isChange) {
          if (update_data.info && !isError) {
            for (let attribute in update_data.info) {
              if (isError) {
                break;
              }
              await DB.query(
                `UPDATE properties SET ${attribute}=$1 WHERE property_id=$2;`,
                [update_data.info[attribute], property.property_id]
              ).catch((err) => {
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
                isError = true;
              });
            }
          }
          if (update_data.images && !isError) {
            for (let attribute in update_data.images) {
              if (isError) {
                break;
              }
              if (update_data.images[attribute] === "Remove") {
                await DB.query("DELETE FROM images WHERE image_id=$1;", [
                  property.images[attribute],
                ]).catch((err) => {
                  res.status(500).send({
                    message: "error",
                    error: { code: err.code, detailL: err.detail },
                    full_error: err,
                  });
                  isError = true;
                });
                continue;
              }
              const { name, data } = update_data.images[attribute];
              if (property.images[attribute] !== null) {
                await DB.query(
                  `UPDATE images SET file_name=$1, data=$2 WHERE image_id=$3;`,
                  [name, data, property.images[attribute]]
                ).catch((err) => {
                  res.status(500).send({
                    message: "error",
                    error: { code: err.code, detailL: err.detail },
                    full_error: err,
                  });
                  isError = true;
                });
              } else {
                const insert_image_result = await DB.query(
                  "INSERT INTO images (file_name, data) VALUES($1,$2) RETURNING image_id;",
                  [name, data]
                ).catch((err) => {
                  res.status(500).send({
                    message: "error",
                    error: { code: err.code, detailL: err.detail },
                    full_error: err,
                  });
                  isError = true;
                });
                if (insert_image_result.rows[0].image_id && !isError) {
                  const image_id = insert_image_result.rows[0].image_id;
                  await DB.query(
                    `UPDATE properties SET ${attribute}=$1 WHERE property_id=$2;`,
                    [image_id, property.property_id]
                  ).catch((err) => {
                    res.status(500).send({
                      message: "error",
                      error: { code: err.code, detailL: err.detail },
                      full_error: err,
                    });
                    isError = true;
                  });
                }
              }
            }
          }
          if (!isError) {
            res
              .status(201)
              .send({ message: "success", change: "changes saved." });
          }
        } else {
          res.status(200).send({ message: "success", change: "no change" });
        }
      } else {
        return res
          .status(401)
          .send({ message: "error", error: "Unauthorized" });
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

//Get Property
router.get("/id/:property_id", async (req, res) => {
  let property;
  let username;
  try {
    if (!req.params.property_id) {
      res.status(400).send({ message: "error", error: "Bad request." });
      return;
    }
    //Get Token
    const cookie = req.cookies["jwt"];
    //Verify Token
    const claim = jwt.verify(cookie, process.env.SECRET);
    if (claim) {
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
      if (user_result.rows[0]) {
        username = user_result.rows[0].username;
        const customer_result = await DB.query(
          "SELECT username FROM agents WHERE username=$1 UNION SELECT username FROM webmasters WHERE username=$1;",
          [username]
        );
        const isCustomer = customer_result.rows[0] ? false : true;
        if (username && isCustomer) {
          const property_exist_result = await DB.query(
            "SELECT property_id FROM properties WHERE property_id=$1",
            [req.params.property_id]
          ).catch((err) => {
            res.status(500).send({
              message: "error",
              error: { code: err.code, detailL: err.detail },
              full_error: err,
            });
          });
          if (property_exist_result.rows[0]) {
            const history_result = await DB.query(
              "SELECT * FROM history WHERE username=$1 AND property_id=$2;",
              [username, req.params.property_id]
            ).catch((err) => {
              res.status(500).send({
                message: "error",
                error: { code: err.code, detailL: err.detail },
                full_error: err,
              });
            });
            if (history_result.rows[0]) {
              await DB.query(
                "UPDATE history SET timestamp=CURRENT_TIMESTAMP WHERE username=$1 AND property_id=$2;",
                [username, req.params.property_id]
              ).catch((err) => {
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
              });
            } else {
              await DB.query(
                "INSERT INTO history (property_id, username) VALUES ($1, $2);",
                [req.params.property_id, username]
              ).catch((err) => {
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
              });
              console.log("inserted");
              await DB.query(
                "UPDATE properties SET seen=(SELECT seen + 1 FROM properties WHERE property_id=$1) WHERE property_id=$1;",
                [req.params.property_id]
              ).catch((err) => {
                res.status(500).send({
                  message: "error",
                  error: { code: err.code, detailL: err.detail },
                  full_error: err,
                });
              });
            }
          }
        }
      }
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  } finally {
    const property_result = await DB.query(
      "SELECT * FROM properties WHERE property_id=$1;",
      [req.params.property_id]
    ).catch((err) => {
      res.status(500).send({
        message: "error",
        error: { code: err.code, detailL: err.detail },
        full_error: err,
      });
    });
    if (property_result.rows[0]) {
      const webmaster_result = await DB.query(
        "SELECT * FROM webmasters WHERE username=$1;",
        [username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
      });
      const isWebmaster = webmaster_result.rows[0] ? true : false;
      property = Property.property(property_result.rows[0]);
      if (isWebmaster) {
        res.status(200).send({ message: "success", payload: property });
      } else if (
        property.status === "Pending" ||
        property.status === "Rejected"
      ) {
        res.status(401).send({ message: "error", error: "Unauthorized." });
      } else {
        res.status(200).send({ message: "success", payload: property });
      }
    } else {
      return res
        .status(404)
        .send({ message: "error", error: "Property not found." });
    }
  }
});

//Get Properties
router.get("/query", async (req, res) => {
  let property;
  try {
    let params = {
      furnishing: [],
      ownership: [],
    };
    for (let attribute in req.query) {
      switch (attribute) {
        case "terms":
          params[attribute] = `'%${req.query[attribute].toLowerCase()}%'`;
          break;
        case "contract":
          switch (req.query[attribute]) {
            case "buy":
              params[attribute] = "'Sell'";
              break;
            case "rent":
              params[attribute] = "'Rent'";
              break;
            case "new":
              params[attribute] = "'New house'";
              break;
          }
          break;
        case "property_type":
        case "bedroom":
        case "bathroom":
          params[attribute] = `'${req.query[attribute]}'`;
          break;
        case "min_area":
        case "min_price":
        case "max_area":
        case "max_price":
          let number = Number.parseFloat(req.query[attribute], 10);
          if (number > 0) {
            params[attribute] = number;
          }
          break;
        case "furnished":
          params["furnishing"].push("'Furnished'");
          break;
        case "unfurnished":
          params["furnishing"].push("'Unfurnished'");
          break;
        case "partly_furnished":
          params["furnishing"].push("'Partly furnished'");
          break;
        case "freehold":
          params["ownership"].push("'Freehold'");
          break;
        case "leasehold":
          params["ownership"].push("'Leasehold'");
          break;
        case "air_conditioning":
        case "cctv":
        case "fitness":
        case "library":
        case "parking":
        case "pet_friendly":
        case "security":
        case "swimming_pool":
        case "tv":
        case "balcony":
        case "concierge":
        case "garden":
        case "lift":
        case "playground":
        case "river_view":
        case "single_storey":
        case "sport_center":
        case "wifi":
          if (req.query[attribute] === "false") {
            params[attribute] = req.query[attribute];
          }
          break;
        default:
      }
    }
    let where_cause = "";
    for (let param in params) {
      switch (param) {
        case "terms":
          where_cause += `AND (LOWER(property_name) like ${params[param]} OR LOWER(district::text) like ${params[param]} OR LOWER(province::text) like ${params[param]} OR LOWER(near_station::text) like ${params[param]}) `;
          break;
        case "min_area":
          where_cause += `AND area >= ${params[param]} `;
          break;
        case "min_price":
          where_cause += `AND price >= ${params[param]} `;
          break;
        case "max_area":
          where_cause += `AND area <= ${params[param]} `;
          break;
        case "max_price":
          where_cause += `AND price <= ${params[param]} `;
          break;
        case "furnishing":
          if (params[param].length > 0) {
            let furnishing = params[param].join(",");
            where_cause += `AND furnishing not in (${furnishing}) `;
          }
          break;
        case "ownership":
          if (params[param].length > 0) {
            let ownership = params[param].join(",");
            where_cause += `AND ownership not in (${ownership}) `;
          }
          break;
        default:
          where_cause += `AND ${param}=${params[param]} `;
      }
    }
    where_cause = `WHERE status='Listing' ${where_cause}`;
    const properties_result = await DB.query(
      `SELECT * FROM properties ${where_cause};`
    ).catch((err) => {
      res.status(500).send({
        message: "error",
        error: { code: err.code, detailL: err.detail },
        full_error: err,
      });
      return;
    });
    if (properties_result.rows) {
      let format_properties = properties_result.rows.map((property) =>
        Property.property(property)
      );
      res.status(200).send({ message: "success", payload: format_properties });
    } else {
      res.status(200).send({ message: "success", payload: [] });
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return;
    }
    console.error(err);
    res.status(500).send({
      message: "error",
      error: err.stack,
    });
  }
});

//Get Own Property
router.get("/seller/", async (req, res) => {
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
        return res
          .status(401)
          .status({ message: "error", error: "Unauthorized" });
      }
      const seller = user_result.rows[0].username;
      const property_result = await DB.query(
        "SELECT * FROM properties WHERE seller=$1 ORDER BY property_id;",
        [seller]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
      });
      if (property_result.rows) {
        const property = property_result.rows.map((property) => {
          return Property.property(property);
        });
        res.status(200).send({ message: "success", payload: property });
      } else {
        return res
          .status(401)
          .send({ message: "error", error: "Unauthorized" });
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

//Get Property Seller
router.get("/contact/:property_id", async (req, res) => {
  try {
    if (!req.params.property_id) {
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
        return res
          .status(401)
          .status({ message: "error", error: "Unauthorized" });
      }
      const admin_result = await DB.query(
        "SELECT username FROM agents WHERE username=$1 UNION SELECT username FROM webmasters WHERE username=$2;",
        [user_result.rows[0].username, user_result.rows[0].username]
      ).catch((err) => {
        res.status(500).send({
          message: "error",
          error: { code: err.code, detailL: err.detail },
          full_error: err,
        });
        return;
      });
      if (admin_result.rows[0]) {
        const seller_result = await DB.query(
          "SELECT username, full_name, email, phone_number, avatar_id FROM users INNER JOIN properties ON users.username = properties.seller WHERE property_id=$1;",
          [req.params.property_id]
        ).catch((err) => {
          res.status(500).send({
            message: "error",
            error: { code: err.code, detailL: err.detail },
            full_error: err,
          });
          return;
        });
        res
          .status(200)
          .send({ message: "success", payload: seller_result.rows[0] });
      } else {
        res.status(401).send({
          message: "error",
          error: "Unauthorized",
        });
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
