const DB = require("../db");
const CustomError = require("../tools/CustomError");
const router = require("express").Router();
const fs = require("fs");

// Images' functions
// [GET] : Get avatar's image
router.get("/avatar/:avatar_id", async (req, res) => {
  try {
    if (!req.params.avatar_id) {
      throw new CustomError.BadRequest();
    }
    const avatar_id = req.params.avatar_id;
    //Get Data
    await DB.query("SELECT * FROM avatars WHERE avatar_id=$1", [avatar_id])
      .then((avatar_result) => {
        const avatar = avatar_result.rows[0].data;
        if (avatar) {
          return res.status(200).end(avatar);
        } else {
          throw new CustomError.NotFound("Avatar not found.");
        }
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "avatar_result");
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
// [GET] : Get images
router.get("/:image_id", async (req, res) => {
  try {
    if (!req.params.image_id) {
      throw new CustomError.BadRequest();
    }
    const image_id = req.params.image_id;
    await DB.query("SELECT * FROM images WHERE image_id=$1;", [image_id])
      .then((image_result) => {
        const image = image_result.rows[0].data;
        if (image) {
          return res.status(200).end(image);
        } else {
          throw new CustomError.NotFound("Image not found.");
        }
      })
      .catch((err) => {
        throw new CustomError.DBError(err, "image_result");
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
