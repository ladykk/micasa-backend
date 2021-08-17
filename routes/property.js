require("dotenv/config");
const router = require("express").Router();
const DB = require("../db");
const jwt = require("jsonwebtoken");
const Property = require("../models/property");

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

module.exports = router;
