const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { Review, Spot, User } = require("../../db/models");

// GET /api/reviews/current
router.get("/current", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const reviews = await Review.findAll({
    where: { userId },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"]
      },
      {
        model: Spot,
        attributes: [
          "id",
          "ownerId",
          "address",
          "city",
          "state",
          "country",
          "lat",
          "lng",
          "name",
          "price"
        ]
      }
    ]
  });

  res.status(200).json({ Reviews: reviews });
});

module.exports = router;
