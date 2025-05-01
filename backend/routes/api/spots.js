// backend/routes/api/spots.js
const express = require('express');
const router = express.Router();
const { Spot } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

// Create a Spot
router.post('/', requireAuth, async (req, res, next) => {
    const {
        address, city, state, country, lat, lng, name, description, price
    } = req.body;

    try {
        const newSpot = await Spot.create ({
            ownerId: req.user.id,
            address,
            city,
            state,
            country,
            lat,
            lng,
            name,
            description,
            price
        });
        return res.status(201).json(newSpot);
    } catch (err) {
        next(err);
    }
});
// Get all spots of the current user
router.get('/current', requireAuth, async(req, res, next)=> {
    try {
        const userSpots = await Spot.findAll({
            where: {
                ownerId: req.user.id
            }
        });
        res.json({ Spots: userSpots });
    } catch (err) {
        next(err);
    }
});

// Get All Spots
router.get('/', async (req, res, next) => {
    try {
        const spots = await Spot.findAll();
        return res.json({ Spots: spots });
    } catch (err) {
        next(err);
    }
});


module.exports = router;