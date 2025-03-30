const express = require('express')
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
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
  check('startDate')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a valid start date.'),
  check('endDate')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a valid end date.'),

  handleValidationErrors
];

// GET ALL BOOKINGS
router.get('/', async (req, res) => {
    const bookings = await Booking.findAll();
      return res.json({
        bookings
      });
    }
  );

   // GET ALL BOOKINGS FROM USER
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


  // GIT ALL BOOKINGS FOR SPOT
router.get('/spotbookings/:spotId', requireAuth, async (req, res) =>{
  const { user } = req;

  //Find Spot's owner
  const spot = await Spot.findByPk(req.params.spotId);

    // If the spot does not exist, return a 404 error
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

  //If logged in user is the spot owner
    const ownerBookings = await Booking.findAll({
      where: {
        spotId: req.params.spotId
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
          spotId: req.params.spotId
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



// CREATE BOOKING FROM SPOT
router.post('/', validateBooking, requireAuth, async (req, res) => {
  const { spotId, startDate, endDate } = req.body;
  const { user } = req;
  const userId = user.id;

  //Get spot
  const spot = await Spot.findByPk(spotId);

  // If the spot does not exist, return a 404 error
  if (!spot) {
    return res.status(404).json({ message: "Spot not found" });
  }

  //A user is only authorized to create a booking if they do NOT own the spot
  if (user.id === spot.ownerId) {
    return res.status(403).json({ message: "Owner cannot book own spot" });
  }

  // Check if booking is available for chosen dates
  const existingBooking = await Booking.findOne({
    where: {
      spotId,
      [Op.or]: [
        { startDate: { [Op.between]: [startDate, endDate] } },
        { endDate: { [Op.between]: [startDate, endDate] } },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } }
          ]
        }
      ]
    }
  });

  if (existingBooking) {
    return res.status(403).json({ message: "Spot is already booked for the selected dates" });
  }

  
  //Create the new booking
  const newBooking = await Booking.create({ userId, spotId, startDate, endDate });
  
    return res.status(201).json({
      newBooking
    });
  }
);



// EDIT EXISTING BOOKING
router.patch('/:bookingId', requireAuth, validateBooking, async (req, res) => {
  const { spotId, startDate, endDate } = req.body;
  const { user } = req;
  const userId = user.id;

  //Get booking
  const booking = await Booking.findByPk(req.params.bookingId);

  // If the booking does not exist, return a 404 error
  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  //Only the owner of the booking is authorized to edit
  if (user.id !== booking.userId) {
    return res.status(403).json({ message: "Only the owner of the booking is authorized to edit." });
  }

  // Check if the booking's end date has already passed
  const currentDate = new Date();
  if (new Date(booking.endDate) < currentDate) {
    return res.status(400).json({ message: "Cannot edit past bookings." });
  }

  // Check if booking is available for chosen dates
  const existingBooking = await Booking.findOne({
    where: {
      spotId,
      [Op.or]: [
        { startDate: { [Op.between]: [startDate, endDate] } },
        { endDate: { [Op.between]: [startDate, endDate] } },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } }
          ]
        }
      ]
    }
  });

  if (existingBooking) {
    return res.status(403).json({ message: "Spot is already booked for the selected dates" });
  }

  //Update the new booking
  const updatedBooking = await booking.update({ userId, spotId, startDate, endDate });
  
    return res.status(200).json({
      updatedBooking
    });
  }
);


// DELETE A BOOKING
router.delete('/:bookingId', requireAuth, async (req, res) => {

  const { user } = req;

  //Get booking
  const booking = await Booking.findByPk(req.params.bookingId);

  // If the booking does not exist, return a 404 error
  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  //Get spot 
  const spot = await Spot.findByPk(booking.spotId);

  //Only the owner of booking or spot is authorized to delete
  if (!(user.id === spot.ownerId || user.id === booking.userId)) {
    return res.status(403).json({ message: "Only authorized user allowed to delete booking." });
  }


  // Only delete future bookings
  const currentDate = new Date();
  if (new Date(booking.startDate) < currentDate) {
    return res.status(400).json({ message: "Cannot delete a booking that has already started or passed." });
  }

  //Delete the new booking
   await booking.destroy();
  
    return res.status(200).json({
      message: "Booking successfully deleted"
    });
  }
);



  
  module.exports = router;