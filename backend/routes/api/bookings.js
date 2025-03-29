const express = require('express')
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../../utils/auth');
const { Booking, Spot, User } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { route } = require('./session');

const router = express.Router();

//Validate Spot inputs FIX
const validateBooking = [
  check('spotId')
  .exists({ checkFalsy: true})
  .withMessage('Please provide a valid spot ID.'),
  check('userId')
  .exists({ checkFalsy: true})
  .withMessage('Please provide a valid user ID.'),
  check('startDate')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a valid start date.'),
  check('endDate')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a valid end date.'),

  handleValidationErrors
];

// Get all bookings 
router.get('/', async (req, res) => {
    const bookings = await Booking.findAll();
      return res.json({
        bookings
      });
    }
  );



  // Get all bookings for a Spot 
router.get('/spotbookings/:id', requireAuth, async (req, res) =>{
  const { user } = req;

  //Find Spot's owner
  const spot = await Spot.findByPk(req.params.id);

    // If the spot does not exist, return a 404 error
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

  //If logged in user is the spot owner
    const ownerBookings = await Booking.findAll({
      where: {
        spotId: req.params.id
      },
      include: {
        model: User,
        attributes: [
            'id',
            'firstName',
            'lastName'
        ]
    }
    });
  
    //if logged in user is NOT owner of spot
      const bookings = await Booking.findAll({
        attributes: ['spotId', 'userId', 'startDate', 'endDate'],
        where: {
          spotId: req.params.id
        }
      });

if(spot.ownerId === user.id){
  return res.json({
    ownerBookings
  });
};
if(spot.ownerId !== user.id){
  return res.json({
    bookings
  });
};

}
);



 // Get all bookings from current user 
router.get('/userbookings', requireAuth, async (req, res) => {

  const { user } = req;

  const bookings = await Booking.findAll({
    where: {
      userId: user.id
    },
    include: {
        model: Spot,
        attributes: [
            'id',
            'ownerId',
            'address',
            'city',
            'state',
            'country',
            'lat',
            'lng',
            'name',
            'price',
            'previewImage'
        ]
    }
  });
  
    return res.json({
      bookings
    });
  }
);



  
  module.exports = router;