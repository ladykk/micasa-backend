const DB = require("../db");

const router = require("express").Router();

// Images' functions
// [GET] : Get avatar's image
router.get("/avatar/:avatar_id", async (req, res) => {
  try {
    if (!req.params.avatar_id) {
      return res.status(400).send({
        message: "error",
        error: "Bad request.",
      });
    }
    const avatar_id = req.params.avatar_id;
    //Get Data
    await DB.query("SELECT * FROM avatars WHERE avatar_id=$1", [avatar_id])
      .then((avatar_result) => {
        const avatar = avatar_result.rows[0].data;
        if (avatar) {
          return res.status(200).end(avatar);
        } else {
          return res.status(404).send({
            message: "error",
            error: "Avatar not found.",
          });
        }
      })
      .catch((err) => {
        return res.status(500).send({
          message: "error",
          error: {
            type: "database",
            from: "avatar_result",
            code: err.code,
            detail: err.detail,
            info: err,
          },
        });
      });
  } catch (err) {
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
// [GET] : Get images
router.get("/:image_id", async (req, res) => {
  try {
    if (!req.params.image_id) {
      return res.status(400).send({
        message: "error",
        error: "Bad request.",
      });
    }
    const image_id = req.params.image_id;
    await DB.query("SELECT * FROM images WHERE image_id=$1;", [image_id])
      .then((image_result) => {
        const image = image_result.rows[0].data;
        if (image) {
          return res.status(200).end(image);
        } else {
          return res
            .status(404)
            .send({ message: "error", error: "Image not found/" });
        }
      })
      .catch((err) => {
        return res.status(500).send({
          message: "error",
          error: {
            type: "database",
            from: "image_result",
            code: err.code,
            detail: err.detail,
            info: err,
          },
        });
      });
  } catch (err) {
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
