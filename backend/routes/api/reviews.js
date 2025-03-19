const express = require("express");
const router = express.Router(); // this is the router object
const { setTokenCookie, requireAuth } = require("../../utils/auth.js");
const { User, Spot, SpotImage, Review, Booking } = require("../../db/models");
const { check, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { Op, Model } = require("sequelize");

const checkValidation = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("A review is required."),

  check("stars")
    .exists({ checkFalsy: true })
    .withMessage("Please select a star rating.")
    .isInt({ min: 1, max: 5 })
    .withMessage("Star rating must be an integer between 1 and 5."),

  handleValidationErrors,
];

router.get("/current", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reviews = await Review.findAll({
      where: { userId },
      include: [
        {
          model: Spot,
          include: [
            {
              model: SpotImage,
              attributes: ["url"],
              where: { preview: true },
              required: false,
            },
          ],
        },
        {
          model: ReviewImage,
          attributes: ["id", "url"],
        },
      ],
    });

    const formattedReviews = [];

    for (let i = 0; i < reviews.length; i++) {
      const reviewData = reviews[i].toJSON();
      const images = reviewData.Spot.SpotImages;
      reviewData.Spot.previewImage = images?.length ? images[0].url : null;
      delete reviewData.Spot.SpotImages;
      formattedReviews.push(reviewData);
    }

    return res.status(200).json({ Reviews: formattedReviews });
  } catch(error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "SERVER ERROR" });
  }
});


module.exports = router