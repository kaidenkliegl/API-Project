// backend/routes/api/reviews.js

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../utils/auth');
const { Review, Spot, User } = require('../../db/models');

// Get all reviews for a spot 
router.get('/:spotId/reviews', async (req, res, next) => {
    const spotId = req.params.spotId;

    const reviews = await Review.findAll({
        where: { spotId },
        include: [
            {model: User, attributes: ['id', 'firstName', 'lastName'] }
        ]
    });
    res.json({ Reviews: reviews });

});


// Create a review for a spot // meaning posting a review for spot ID 5
router.post('/:spotId/reviews', requireAuth, async (req,res, next) => {
    const spotId = req.params.spotId;
    const userId = req.user.id;
    const { review, stars } = req.body;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const newReview = await Review.create({ 
        userId,
        spotId,
        review,
        stars
    });
    res.status(201).json(newReview);

});

module.exports = router;
