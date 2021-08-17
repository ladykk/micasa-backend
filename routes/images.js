const DB = require("../db");

const router = require("express").Router();

//Avatar
router.get("/avatar/:avatar_id", async (req, res) => {
  try {
    //Get avatar_id
    const avatar_id = req.params.avatar_id;
    //Get Data
    const result = await DB.query("SELECT * FROM avatars WHERE avatar_id=$1", [
      avatar_id,
    ]);
    const avatar = result.rows[0].data;
    if (avatar) {
      res.status(200).end(avatar);
    } else {
      res.status(404);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "error",
    });
  }
});

module.exports = router;
