require("dotenv/config");
const router = require("express").Router();
const DB = require("../db");
const Property = require("../models/property");
const UserTools = require("../tools/UserTools");
const CustomError = require("../tools/CustomError");
const { JsonWebTokenError } = require("jsonwebtoken");

// [POST] : Add property.
router.post("/add", async (req, res) => {
  try {
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    }
    const customer = await UserTools.checkIsCustomer(user.username);
    //Check is customer.
    if (!customer) {
      //CASE: User is not a customer.
      throw new CustomError.Unauthorized("User is not a customer.");
    } else {
      //CASE: User is a customer.
      //Check is model correct.
      const new_property = Property.new_property(req.body, req.files);
      if (!new_property) {
        //CASE: Model incorrect.
        throw new CustomError.BadRequest();
      } else {
        //CASE: Model correct.
        //Add image_cover.
        const { data, name } = new_property.images["image_cover"];
        //Insert image
        const insert_image_cover_result = await DB.query(
          "INSERT INTO images (file_name, data) VALUES ($1, $2) RETURNING image_id;",
          [name, data]
        ).catch((err) => {
          throw new CustomError.DBError(err, `insert_image_cover_result`);
        });
        const image_cover_id = insert_image_cover_result.rows[0].image_id;
        if (!image_cover_id) {
          //CASE: Not return image_id.
          throw new CustomError.ServerError("Cannot add image_cover");
        }
        //Insert property into database.
        const inserted_result = await DB.query(
          "INSERT INTO properties (property_name, property_type, price, contract_type, ownership, rent_payment, rent_requirement, area, bedroom, bathroom, furnishing, description, district, province, near_station, maps_query, air_conditioning, balcony, cctv, concierge, fitness, garden, library, lift, parking, playground, pet_friendly, river_view, security, single_storey, swimming_pool, sport_center, tv, wifi, image_cover) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35) RETURNING property_id;",
          [
            new_property.property_name,
            new_property.property_type,
            new_property.price,
            new_property.contract_type,
            new_property.ownership,
            new_property.rent_payment,
            new_property.rent_requirement,
            new_property.area,
            new_property.bedroom,
            new_property.bathroom,
            new_property.furnishing,
            new_property.description,
            new_property.district,
            new_property.province,
            new_property.near_station,
            new_property.maps_query,
            new_property.air_conditioning,
            new_property.balcony,
            new_property.cctv,
            new_property.concierge,
            new_property.fitness,
            new_property.garden,
            new_property.library,
            new_property.lift,
            new_property.parking,
            new_property.playground,
            new_property.pet_friendly,
            new_property.river_view,
            new_property.security,
            new_property.single_storey,
            new_property.swimming_pool,
            new_property.sport_center,
            new_property.tv,
            new_property.wifi,
            image_cover_id,
          ]
        ).catch((err) => {
          throw new CustomError.DBError(err, "inserted_result");
        });
        //Check is return property id.
        if (inserted_result.rows[0].property_id) {
          //CASE: Return property_id
          const property_id = Number.parseInt(
            inserted_result.rows[0].property_id,
            10
          );
          //Update owner of property.
          await DB.query(
            "INSERT INTO owners (customer_id, property_id) VALUES ($1, $2);",
            [customer.customer_id, property_id]
          ).catch((err) => {
            throw new CustomError.DBError(err, " update_owner_result");
          });
          //Insert images
          for (let id in new_property.images) {
            //Check is image is null.
            if (!new_property.images[id]) {
              //CASE: Image is null
              continue;
            } else if (id === "image_cover") {
              //CASE: Is image_cover;
              continue;
            } else {
              //CASE: Image not null
              const { data, name } = new_property.images[id];
              //Insert image
              await DB.query(
                "INSERT INTO images (file_name, data) VALUES ($1, $2) RETURNING image_id;",
                [name, data]
              )
                .then(async (insert_image_result) => {
                  await DB.query(
                    `UPDATE properties SET ${id}=$1 WHERE property_id=$2`,
                    [insert_image_result.rows[0].image_id, property_id]
                  ).catch((err) => {
                    throw new CustomError.DBError(err, `update_${id}_result`);
                  });
                })
                .catch((err) => {
                  throw new CustomError.DBError(err, `insert_${id}_result`);
                });
            }
          }
          return res.status(201).send({ message: "success" });
        } else {
          //CASE: Not return property id.
          throw new CustomError.ServerError("not return property_id.");
        }
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
// [GET] : Get property for edit.
router.get("/edit/:property_id", async (req, res) => {
  try {
    //Check required information.
    if (!req.params.property_id) {
      //CASE: Some information missing.
      throw new CustomError.BadRequest();
    }
    const property_id = req.params.property_id;
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    }
    const customer = await UserTools.checkIsCustomer(user.username);
    //Check is a customer.
    if (!customer) {
      //CASE: Not a customer
      throw new CustomError.Unauthorized();
    } else {
      //Check if user is an owner.
      const owner_result = await DB.query(
        "SELECT * FROM owners WHERE customer_id=$1 AND property_id=$2",
        [customer.customer_id, property_id]
      ).catch((err) => {
        throw new CustomError.DBError(err, "owner_result");
      });
      if (owner_result.rows[0]) {
        //CASE: Is an owner
        const property_result = await DB.query(
          "SELECT * FROM properties WHERE property_id=$1",
          [property_id]
        ).catch((err) => {
          throw new CustomError.DBError(err, "property_result");
        });
        //Check is found property.
        if (property_result.rows[0]) {
          //CASE: Found property.
          const property = Property.property(property_result.rows[0]);
          return res
            .status(200)
            .send({ message: "success", payload: property });
        } else {
          //CASE: Not found property.
          throw new CustomError.NotFound("Property not found.");
        }
      } else {
        throw new CustomError.Unauthorized();
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
// [PATCH] : Update property.
router.patch("/edit/:property_id", async (req, res) => {
  try {
    //Check require information.
    if (!req.params.property_id) {
      //CASE: Some information missing.
      throw new CustomError.BadRequest();
    }
    const property_id = req.params.property_id;
    //Check Authorization
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    }
    const customer = await UserTools.checkIsCustomer(user.username);
    if (!customer) {
      //CASE: Not a customer
      throw new CustomError.Unauthorized();
    } else {
      //Check if user is an owner.
      const owner_result = await DB.query(
        "SELECT * FROM owners WHERE customer_id=$1 AND property_id=$2",
        [customer.customer_id, property_id]
      ).catch((err) => {
        throw new CustomError.DBError(err, "owner_result");
      });
      if (owner_result.rows[0]) {
        //CASE: Is an owner
        //Check is found property.
        const property_result = await DB.query(
          "SELECT * FROM properties WHERE property_id=$1",
          [property_id]
        ).catch((err) => {
          throw new CustomError.DBError(err, "property_result");
        });
        if (property_result.rows[0]) {
          //CASE: Property found
          const property = property_result.rows[0];
          const status = property.status;
          //Check is Sold.
          if (status === "Sold") {
            //CASE: Property is being sold.
            throw new CustomError.Unauthorized("Property is already sold");
          } else {
            //CASE: Property is not sold.
            const update_data = Property.update_data(req.body, req.files);
            //Check is sold
            if (update_data.info["status"] === "Sold") {
              //CASE: Sold property
              //Check is have buyer
              if (update_data.buyer) {
                //CASE: Has buyer
                //Check is buyer exist.
                const buyer = await UserTools.checkIsCustomer(
                  update_data.buyer
                );
                if (buyer) {
                  //CASE: Has buyer
                  //Insert into buyer
                  await DB.query(
                    "INSERT INTO buyers (customer_id, property_id) VALUES ($1, $2);",
                    [buyer.customer_id, property_id]
                  )
                    .then(async (insert_buyer_result) => {
                      //Insert into reviews
                      await DB.query(
                        "INSERT INTO reviews (customer_id, property_id, role) VALUES ($1, $2, 'Buyer')",
                        [buyer.customer_id, property_id]
                      ).catch((err) => {
                        throw new CustomError.DBError(
                          err,
                          "insert_buyer_review_result"
                        );
                      });
                      //Check is owner is MI CASA account
                      if (customer.username !== "property") {
                        //CASE: Not MI CASA Account
                        await DB.query(
                          "INSERT INTO reviews (customer_id, property_id, role) VALUES ($1, $2, 'Seller')",
                          [customer.customer_id, property_id]
                        ).catch((err) => {
                          throw new CustomError.DBError(
                            err,
                            "insert_seller_review_result"
                          );
                        });
                      }
                    })
                    .catch((err) => {
                      throw new CustomError.DBError(err, "insert_buyer_result");
                    });
                } else {
                  //CASE: Buyer not exist.
                  throw new CustomError.BadRequest("Buyer not exist.");
                }
              } else {
                throw new CustomError.BadRequest("Sold without buyer.");
              }
            }
            //Check is there a update.
            if (update_data.isChange) {
              //CASE: Changes.
              //Update infos values.
              for (let attribute in update_data.info) {
                await DB.query(
                  `UPDATE properties SET ${attribute}=$1 WHERE property_id=$2;`,
                  [update_data.info[attribute], property_id]
                ).catch((err) => {
                  throw new CustomError.DBError(
                    err,
                    `update_${attribute}_result`
                  );
                });
              }
              //Update images value.
              for (let attribute in update_data.images) {
                //Check image change.
                if (update_data.images[attribute] === "Remove") {
                  //CASE: Remove image.
                  await DB.query("DELETE FROM images WHERE image_id=$1;", [
                    property[attribute],
                  ]).catch((err) => {
                    throw new CustomError.DBError(
                      err,
                      `remove_${attribute}_result`
                    );
                  });
                } else {
                  //CASE: Update image.
                  const { name, data } = update_data.images[attribute];
                  //Check is has image.
                  if (property[attribute] !== null) {
                    //CASE: Has image.
                    //Update file.
                    await DB.query(
                      `UPDATE images SET file_name=$1, data=$2 WHERE image_id=$3;`,
                      [name, data, property[attribute]]
                    ).catch((err) => {
                      throw new CustomError.DBError(
                        err,
                        `update_${attribute}_result`
                      );
                    });
                  } else {
                    //CASE: No image.
                    //Insert file.
                    const insert_image_result = await DB.query(
                      "INSERT INTO images (file_name, data) VALUES($1,$2) RETURNING image_id;",
                      [name, data]
                    ).catch((err) => {
                      throw new CustomError.DBError(
                        err,
                        `insert_${attribute}_result`
                      );
                    });
                    //Check is return image_id.
                    if (insert_image_result.rows[0].image_id) {
                      //CASE: image_id returned.
                      const image_id = insert_image_result.rows[0].image_id;
                      await DB.query(
                        `UPDATE properties SET ${attribute}=$1 WHERE property_id=$2;`,
                        [image_id, property_id]
                      ).catch((err) => {
                        throw new CustomError.DBError(
                          err,
                          `update_${attribute}_result`
                        );
                      });
                    } else {
                      //CASE: image_id not returned.
                      throw new CustomError.ServerError(
                        `${attribute} not return image_id after insert.`
                      );
                    }
                  }
                }
              }
            }
            return res.status(201).send({ message: "success" });
          }
        } else {
          //CASE: Not found property.
          throw new CustomError.NotFound("Property not found.");
        }
      } else {
        //CASE: Not an owner.
        throw new CustomError.Unauthorized();
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
// [GET] : Get property by id.
router.get("/id/:property_id", async (req, res) => {
  let property = null;
  let property_id = null;
  let user;
  let is_query_property = false;
  let is_response_sent = false;
  try {
    //Check required information.
    if (!req.params.property_id) {
      throw new CustomError.BadRequest();
    }
    property_id = req.params.property_id;
    //Check Authorization.
    user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    }
    const customer = await UserTools.checkIsCustomer(user.username);
    //Check is a customer.
    if (customer) {
      //CASE: User is a customer
      //Query property
      const property_result = await DB.query(
        "SELECT * FROM properties WHERE property_id=$1",
        [property_id]
      ).catch((err) => {
        throw new CustomError.DBError(err, "property_result");
      });
      //Check is property exist.
      if (property_result.rows[0]) {
        //CASE: Property is exist.
        //Set property
        property = Property.property(property_result.rows[0]);
        is_query_property = true;
        //Check is owner
        const owner_result = await DB.query(
          "SELECT * FROM owners WHERE property_id=$1",
          [property_id]
        ).catch((err) => {
          throw new CustomError.DBError(err, "property_result");
        });
        if (owner_result.rows[0].customer_id !== customer.customer_id) {
          //CASE: User is not an owner.
          //Check is property in history
          const history_result = await DB.query(
            "SELECT * FROM history WHERE customer_id=$1 AND property_id=$2;",
            [customer.customer_id, property_id]
          ).catch((err) => {
            throw new CustomError.DBError(err, "history_result");
          });
          if (history_result.rows[0]) {
            //CASE: Property is in history.
            //Update Timestamp.
            await DB.query(
              "UPDATE history SET timestamp=CURRENT_TIMESTAMP WHERE customer_id=$1 AND property_id=$2;",
              [customer.customer_id, property_id]
            ).catch((err) => {
              throw new CustomError.DBError(err, "update_history_result");
            });
          } else {
            //CASE: Property is not in history.
            await DB.query(
              "INSERT INTO history (property_id, customer_id) VALUES ($1, $2);",
              [property_id, customer.customer_id]
            )
              .then(async (insert_history_result) => {
                await DB.query(
                  "UPDATE properties SET seen=(SELECT seen + 1 FROM properties WHERE property_id=$1) WHERE property_id=$1;",
                  [property_id]
                ).catch((err) => {
                  throw new CustomError.DBError(err, "update_seen_result");
                });
              })
              .catch((err) => {
                throw new CustomError.DBError(err, "insert_history_result");
              });
          }
        }
      } else {
        throw new CustomError.NotFound("Property not found.");
      }
    }
  } catch (err) {
    if (!(err instanceof JsonWebTokenError)) {
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
      is_response_sent = true;
    }
  } finally {
    //Check is response not sent.
    if (!is_response_sent) {
      try {
        //CASE: Response is not sent
        //Check is query.
        if (!is_query_property) {
          //CASE: Not query
          const property_result = await DB.query(
            "SELECT * FROM properties WHERE property_id=$1",
            [property_id]
          ).catch((err) => {
            throw new CustomError.DBError(err, "property_result (finally)");
          });
          if (property_result.rows[0]) {
            property = Property.property(property_result.rows[0]);
          }
        }
        //Check is property found
        if (!property) {
          //CASE: Property not found.
          throw new CustomError.NotFound("Property not found.");
        } else {
          //CASE: Property found.
          //Check is there is user
          if (user) {
            //Check is user a webmaster.
            const webmaster = await UserTools.checkIsWebmaster(user.username);
            if (webmaster) {
              //CASE: User is webmaster
              return res.status(200).send({
                message: "success",
                payload: property,
              });
            }
          }
          //Check status of property
          switch (property.status) {
            //CASE: Not allow.
            case "Pending":
            case "Rejected":
              throw new CustomError.Unauthorized();
            //CASE: Allow.
            default:
              return res.status(200).send({
                message: "success",
                payload: property,
              });
          }
        }
      } catch (err_finally) {
        const { status, error } = CustomError.handleResponse(err_finally);
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
              stack: err_finally.stack,
            },
          });
        }
      }
    }
  }
});
// [GET] : Get properties by query.
router.get("/query", async (req, res) => {
  try {
    let params = {
      furnishing: [],
      ownership: [],
    };
    //Get params
    for (let attribute in req.query) {
      switch (attribute) {
        case "terms":
          params[attribute] = `'%${req.query[attribute].toLowerCase()}%'`;
          break;
        case "contract_type":
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
          if (req.query[attribute] === "true") {
            params[attribute] = req.query[attribute];
          }
          break;
        default:
      }
    }
    //Convert params to where cause.
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
            where_cause += `AND furnishing in (${furnishing}) `;
          }
          break;
        case "ownership":
          if (params[param].length > 0) {
            let ownership = params[param].join(",");
            where_cause += `AND ownership in (${ownership}) `;
          }
          break;
        default:
          where_cause += `AND ${param}=${params[param]} `;
      }
    }
    where_cause = `WHERE status='Listing' ${where_cause}`;
    //Query
    const properties_result = await DB.query(
      `SELECT * FROM properties ${where_cause};`
    ).catch((err) => {
      throw new CustomError.DBError(err, "properties_result");
    });
    //Check is null
    if (properties_result.rows) {
      //CASE: Not null
      //Format
      let format_properties = properties_result.rows.map((property) =>
        Property.property(property)
      );
      res.status(200).send({ message: "success", payload: format_properties });
    } else {
      //CASE: Null
      res.status(200).send({ message: "success", payload: [] });
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
// [GET] : Get own properties
router.get("/owned/", async (req, res) => {
  try {
    //Check Authorization
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    }
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //CASE: User is a customer.
      const properties_result = await DB.query(
        "SELECT * FROM properties NATURAL JOIN owners WHERE customer_id=$1 ORDER BY property_id;",
        [customer.customer_id]
      ).catch((err) => {
        throw new CustomError.DBError(err, "properties_result");
      });
      //Check is properties null
      if (properties_result.rows) {
        //CASE: Not null
        //Format
        const properties = properties_result.rows.map((property) => {
          return Property.property(property);
        });
        res.status(200).send({ message: "success", payload: properties });
      } else {
        //CASE: Null
        res.status(200).send({ message: "success", payload: [] });
      }
    } else {
      //CASE: User is not a customer.
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
// [GET] : Get is user can favorite properties.
router.get("/favorite/:property_id", async (req, res) => {
  try {
    //Check required information.
    if (!req.params.property_id) {
      throw new CustomError.BadRequest();
    }
    const property_id = Number.parseInt(req.params.property_id, 10);
    //Check Authorization.
    const user = await UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    }
    //Check is customer.
    const customer = await UserTools.checkIsCustomer(user.username);
    if (customer) {
      //CASE: User is a customer.
      //Check is user a owner.
      const owner_result = await DB.query(
        "SELECT * FROM owners WHERE property_id=$1 AND customer_id=$2;",
        [property_id, customer.customer_id]
      ).catch((err) => {
        throw new CustomError.DBError(err);
      });
      if (owner_result.rows[0]) {
        //CASE: User is an owner.

        return res.status(200).send({
          message: "success",
          payload: false,
        });
      } else {
        //CASE: User is not an owner.
        return res.status(200).send({
          message: "success",
          payload: true,
        });
      }
    } else {
      //CASE: User is not a customer.
      return res.status(200).send({
        message: "success",
        payload: false,
      });
    }
  } catch (err) {
    if (
      err instanceof JsonWebTokenError ||
      err instanceof CustomError.Unauthorized
    ) {
      return res.status(200).send({
        message: "success",
        payload: false,
      });
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
// [GET] : Get owner's contact.
router.get("/contact/:property_id", async (req, res) => {
  try {
    //Check required information
    if (!req.params.property_id) {
      res.status(400).send({ message: "error", error: "Bad request." });
      return;
    }
    const property_id = req.params.property_id;
    //Check Authorization.
    const user = UserTools.validateToken(req);
    //Check is token valid and found user.
    if (!user) {
      res.cookie("jwt", "", { maxAge: 0 });
      throw new CustomError.Unauthorized();
    }
    //Check is user a staff.
    const staff = UserTools.checkIsStaff(user.username);
    if (staff) {
      //CASE: User is staff.
      const owner_result = await DB.query(
        "SELECT username, full_name, email, phone_number, avatar_id FROM users INNER JOIN customers USING(username) INNER JOIN owners USING(customer_id) WHERE property_id=$1;",
        [property_id]
      ).catch((err) => {
        throw new CustomError.DBError(err, "owner_result");
      });
      res
        .status(200)
        .send({ message: "success", payload: owner_result.rows[0] });
    } else {
      //CASE: User is not a staff.
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
