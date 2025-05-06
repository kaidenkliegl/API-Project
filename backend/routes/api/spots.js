// backend/routes/api/spots.js
const express = require('express');
const router = express.Router();
const { Spot, SpotImage, Booking, User } = require('../../db/models');
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

// Add an image
router.post('/:spotId/images', requireAuth, async (req, res, next) => {
    // :spotId is a URL parameter, you can access later as req.params.spotId
    // requireAuth is middleware that checks if the user is logged in.
    const spotId = req.params.spotId; 
    // This reads the spotId from the URL
    // if you call /api/spots/5/images, then spotId will be 5

    const {url, preview } = req.body;
    /*
    { 
        "url": "https://example.com/photo.jpg",
        "preview": true
    }
        url is the image's web address
        preview is boolean (true or false)
     */

    // find by primary key
    const spot = await Spot.findByPk(spotId);
    // if spot not found, send a 404 response
    if (!spot) {
        return res.status(404).json({message: "Spot couldn't be found"});
    }
    // if found but owned by someone else, send a 403 "Forbidden"
    if (spot.ownerId !== req.user.id) {
        return res.status(403).json({ message:"Forbidden"});
    }

    // once passed, create a new image
    const newImage = await SpotImage.create({
        spotId,
        url,
        preview
    });
    
    res.status(201).json({
        id: newImage.id,
        url: newImage.url,
        preview: newImage.preview
    });
});

// Edit a Spot
router.put('/:spotId', requireAuth, async (req, res, next) => {
    const spotId = req.params.spotId;
    const {
      address, city, state, country,
      lat, lng, name, description, price
    } = req.body;
  
    try {
      const spot = await Spot.findByPk(spotId);
  
      if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found" });
      }
  
      if (spot.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
  
      await spot.update({
        address, city, state, country,
        lat, lng, name, description, price
      });
  
      return res.json(spot);
    } catch (err) {
      next(err);
    }
  });
  

  // Delete a Spot

  router.delete('/:spotId', requireAuth, async (req, res) => {
    const spotId = req.params.spotId;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found" });
    }
    if (spot.ownerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
    }

    await spot.destroy();
    return res.json({ message: "Successfully deleted" });
});




// Booking for a spot (If owner)
router.get('/:spotId/bookings', requireAuth, async (req, res, next) => {
    // This pull spotId from the URl -> which spot you're querying
    const spotId = req.params.spotId;
    // This gets the current logged-in user's ID -> who is making the request
    const userId = req.user.id;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found"});
    }

    if(spot.ownerId !== userId) { //if owner id isn't the current userId
        // If not the owner, only show limited booking info
        const bookings = await Booking.findAll({
            where: {spotId},
            attributes: ['spotId', 'startDate', 'endDate']
        });
        return res.json({ Bookings: bookings });
    } else {
        // If the owner, show full booking info + user
        const bookings = await Booking.findAll({
            where: {spotId},
            include: {
                model: User,
                attributes: ['id', 'firstName', 'lastName']
            }
        });
        return res.json({ Bookings: bookings });
    }
});

// Create a booking for a spot
router.post('/:spotId/bookings', requireAuth, async (req, res, next) => {
    const spotId = req.params.spotId;
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found" });
    }

    const newBooking = await Booking.create({
        spotId,
        userId,
        startDate,
        endDate
    });

    res.status(201).json(newBooking);
});




module.exports = router;