const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { Review, Spot, User, ReviewImage } = require("../../db/models");

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

// GET /api/spots/:spotId/reviews
router.get('/spots/:spotId/reviews', async (req, res) => {
    const { spotId } = req.params;
  
    const reviews = await Review.findAll({
      where: { spotId },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: ReviewImage,
          attributes: ['id', 'url']
        }
      ]
    });
  
    if (!reviews.length) {
      return res.status(404).json({ message: "Spot couldn't be found" });
    }
  
    res.status(200).json({ Reviews: reviews });
  });

// POST /api/reviews/:reviewId/images
router.post('/:reviewId/images', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const { url } = req.body;
    const userId = req.user.id;
  
    const review = await Review.findByPk(reviewId);
  
    if (!review) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }
  
    if (review.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
  
    const existingImages = await review.getReviewImages(); // Sequelize magic method
  
    if (existingImages.length >= 10) {
      return res.status(403).json({
        message: "Maximum number of images for this resource was reached"
      });
    }
  
    const newImage = await ReviewImage.create({
      reviewId,
      url
    });
  
    return res.status(201).json({
      id: newImage.id,
      url: newImage.url
    });
  });
  
// PUT /api/reviews/:reviewId
router.put('/:reviewId', requireAuth, async (req, res) => {
  const { reviewId } = req.params;
  const { review, stars } = req.body;
  const userId = req.user.id;

  // Find the review
  const existingReview = await Review.findByPk(reviewId);

  if (!existingReview) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }

  // Check if the logged-in user is the owner
  if (existingReview.userId !== userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Validate inputs
  const errors = {};
  if (!review) errors.review = "Review text is required";
  if (!stars || stars < 1 || stars > 5) errors.stars = "Stars must be an integer from 1 to 5";

  if (Object.keys(errors).length) {
    return res.status(400).json({
      message: "Validation error",
      errors
    });
  }

  // Update the review
  existingReview.review = review;
  existingReview.stars = stars;
  await existingReview.save();

  return res.status(200).json(existingReview);
});



// DELETE /api/reviews/:reviewId

router.delete('/:reviewId', requireAuth, async (req, res) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
  
    const review = await Review.findByPk(reviewId);
  
    if (!review) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }
  
    if (review.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
  
    await review.destroy();
  
    return res.status(200).json({ message: "Successfully deleted" });
  });
  


module.exports = router;
