// backend/routes/api/bookings.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { Booking, Spot, SpotImage } = require("../../db/models");
const { Op } = require("sequelize");

// GET /api/bookings/current
router.get("/current", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const bookings = await Booking.findAll({
    where: { userId },
    include: {
      model: Spot,
      attributes: {
        exclude: ["description", "createdAt", "updatedAt"]
      },
      include: {
        model: SpotImage,
        where: { preview: true },
        required: false,
        attributes: ["url"]
      }
    }
  });

  const formatted = bookings.map(booking => {
    const bookingData = booking.toJSON();
    const previewImage = bookingData.Spot.SpotImages[0]?.url || null;
    bookingData.Spot.previewImage = previewImage;
    delete bookingData.Spot.SpotImages;
    return bookingData;
  });

  res.status(200).json({ Bookings: formatted });
});


// PUT /api/bookings/:bookingId
router.put('/:bookingId', requireAuth, async (req, res) => {
    const { bookingId } = req.params;
    const { startDate, endDate } = req.body;
    const userId = req.user.id;
  
    const booking = await Booking.findByPk(bookingId, {
      include: Spot
    });
  
    if (!booking) {
      return res.status(404).json({ message: "Booking couldn't be found" });
    }
  
    if (booking.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
  
    const currentDate = new Date();
    const bookingEnd = new Date(booking.endDate);
    if (bookingEnd < currentDate) {
      return res.status(403).json({ message: "Past bookings can't be modified" });
    }
  
    // Validation
    const errors = {};
    if (!startDate || new Date(startDate) < currentDate) {
      errors.startDate = "startDate cannot be in the past";
    }
    if (!endDate || new Date(endDate) <= new Date(startDate)) {
      errors.endDate = "endDate cannot be on or before startDate";
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ message: "Validation error", errors });
    }
  
    // Conflict check
    const existingBookings = await Booking.findAll({
      where: {
        spotId: booking.spotId,
        id: { [Op.ne]: booking.id }, // exclude this booking
        [Op.or]: [
          {
            startDate: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            endDate: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });
  
    if (existingBookings.length > 0) {
      return res.status(403).json({
        message: "Sorry, this spot is already booked for the specified dates",
        errors: {
          startDate: "Start date conflicts with an existing booking",
          endDate: "End date conflicts with an existing booking"
        }
      });
    }
  
    // Update
    booking.startDate = startDate;
    booking.endDate = endDate;
    await booking.save();
  
    return res.status(200).json(booking);
  });
  

// DELETE /api/bookings/:bookingId
router.delete('/:bookingId', requireAuth, async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user.id;
  
    const booking = await Booking.findByPk(bookingId, {
      include: { model: Spot }
    });
  
    if (!booking) {
      return res.status(404).json({ message: "Booking couldn't be found" });
    }
  
    // Only allow delete if the user owns the booking OR owns the spot
    if (booking.userId !== userId && booking.Spot.ownerId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
  
    const now = new Date();
    const start = new Date(booking.startDate);
    if (start <= now) {
      return res.status(403).json({
        message: "Bookings that have been started can't be deleted"
      });
    }
  
    await booking.destroy();
    return res.status(200).json({ message: "Successfully deleted" });
  });
  
module.exports = router;
