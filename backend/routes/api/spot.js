const express = require("express");
const router = express.Router(); // this is the router object
const { setTokenCookie, requireAuth } = require("../../utils/auth.js");
const { User, Spot, SpotImage, Review, Booking } = require("../../db/models");
const { check, query } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const { Op, Model } = require("sequelize");

//Using a validation middleware to catch any errors before they reach the database
const validateSpot = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("An address is required."),

  check("city")
    .exists({ checkFalsy: true })
    .withMessage("Valid city required."),

  check("state")
    .exists({ checkFalsy: true })
    .withMessage("Valid state required."),

  check("country")
    .exists({ checkFalsy: true })
    .withMessage("Valid country required."),

  check("lat")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be an number between -90 and 90."),

  check("lng")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be an number between -180 and 180."),

  check("name")
    .exists({ checkFalsy: true })
    .isLength({ min: 1, max: 50 })
    .withMessage(
      "Name is required and must not exceed 50 characters and must have a minimum characters of 1."
    ),

  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required."),

  check("price")
    .exists({ checkFalsy: true })
    .isFloat({ min: 0.1 })
    .withMessage("Price must be a positive number."),

  handleValidationErrors,
];

//pagination and filtering
const ValidateQueryFilters = [
  query("page")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Page should be a number and must be greater than 0."),

  query("size")
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage("Size should be between 1 and 100."),

  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a positive number."),

  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a positive number."),

  query("state")
    .optional()
    .isString()
    .withMessage("State must be a valid string."),

  query("city")
    .optional()
    .isString()
    .withMessage("City must be a valid string."),

  handleValidationErrors,
];

//get all spots
router.get("/", ValidateQueryFilters, async (req, res) => {
  try {
    const { page = 1, size = 20, minPrice, maxPrice, state, city } = req.query;
    //pagination. Databases use zero based indexing
    //parsing to turn the params into a number
    let limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;
    //query filter object
    let where = {};
    //I'm storing this in the where object.. basically storing and sql statement that would be "SELECT * FROM spots WHERE price >= 100;""
    if (minPrice) where.price = { [Op.gte]: parseFloat(minPrice) };
    //Now Storing "SELECT * FROM spots WHERE price BETWEEN 100 AND 500" as where.price
    if (maxPrice)
      where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    if (city) where.city = city;
    if (state) where.state = state;

    const spots = await Spot.findAll({
      where,
      limit,
      offset,
      include: [
        {
          model: SpotImage,
          attributes: ["url"], // we must use array here. sequelize requires.
          limit: 1, //might want to add a preview image column later. I believe this jsut chooses one image. Not a designated image to preview
        },
      ],
    });
    // return a json object
    return res.status(200).json({ Spots: spots, page, size });
  } catch (error) {
    console.error("Error... could not fetch spots");
    return res.status(500).json({ message: "Error retrieving spots" });
  }
});

//get current users spots
router.get("/current", requireAuth, async (req, res) => {
  //used the requuireAuth middleware imported
  try {
    const userId = req.user.id;
    const spots = await Spot.findAll({
      where: { ownerId: userId },
      include: [
        {
          model: SpotImage,
          attributes: ["url"],
          limit: 1,
        },
      ],
    });
    return res.status(200).json({ Spots: spots });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving spots" });
  }
});

//getting a spot from an id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    //use findByPk and get it from the req.params
    const spot = await Spot.findByPk(id, {
      include: [
        {
          model: SpotImage,
          attributes: ["url"],
          limit: 1,
        },
      ],
    });
    if (!spot) return res.status(404).json({ message: "No spot was found" });

    return res.status(200).json({ Spot: spot });
  } catch (error) {
    console.error("Error fetching spot");
    return res.status(500).json({ message: "Error retrieving spot from id" });
  }
});

//creating a new spot
router.post("/", requireAuth, validateSpot, async (req, res) => {
  try {
    const {
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    } = req.body;

    const ownerId = req.user.id;

    const newSpot = Spot.create({
      ownerId,
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    });

    return res.status(200).json({ newSpot: newSpot });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not create a new Spot" });
  }
});

//add an image to the spot by spot id in params
router.post("/:id/images", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { url, preview } = req.body;

    const spot = await Spot.findByPk(id);

    console.log('spot found here!!!!', spot)

    if (!spot) return res.status(404).json({ message: "Spot not found" });

    if (spot.ownerId !== userId)
      return res.status(403).json({ message: "Forbidden access!" });

    const image = SpotImage.create({
      spotId: id,
      url,
      preview,
    });

    return res.status(200).json({
      id: image.id,
      url: image.url,
      preview: image.preview
    })
  } catch (error) {
    console.error('Could not add Image.', error)
    return res.send(500).json({message: "Internal server error"})
  }
});

module.exports = router;
