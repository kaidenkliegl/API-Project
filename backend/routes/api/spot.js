const express = require('express')
const router = express.Router(); // this is the router object 
const {setTokenCookie, requireAuth} = require('../../utils/auth.js')
const { User, Spot, SpotImage, Review, Booking } = require('../../db/models');
const { check, query } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { Op, Model } = require('sequelize');

//Using a validation middleware to catch any errors before they reach the database 
const validateSpot = [
    check('address')
        .exists({ checkFalsy: true })
        .withMessage( 'An address is required.' ),

    check('city')
        .exists({ checkFalsy: true })
        .withMessage( 'Valid city required.' ),

    check('state')
        .exists({ checkFalsy: true })
        .withMessage( 'Valid state required.' ),

    check('country')
        .exists({ checkFalsy: true })
        .withMessage( 'Valid country required.' ),

    check('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage( 'Latitude must be an number between -90 and 90.'),

    check('lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage( 'Longitude must be an number between -180 and 180.'),

        check('name')
        .exists({ checkFalsy: true })
        .isLength({ min: 1, max: 50 })
        .withMessage('Name is required and must not exceed 50 characters and must have a minimum characters of 1.'),
    
      check('description')
        .exists({ checkFalsy: true })
        .withMessage('Description is required.'),
    
      check('price')
        .exists({ checkFalsy: true })
        .isFloat({ min: 0.1 })
        .withMessage('Price must be a positive number.'),
    
      handleValidationErrors
]

//pagination and filtering
const ValidateQueryFilters = [
    query('page')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Page should be a number and must be greater than 0.'),

    query('size')
        .optional()
        .isFloat({ min: 1, max: 100 })
        .withMessage('Size should be between 1 and 100.'),

    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum price must be a positive number.'),
    
      query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum price must be a positive number.'),
    
      query('state')
        .optional()
        .isString()
        .withMessage('State must be a valid string.'),
    
      query('city')
        .optional()
        .isString()
        .withMessage('City must be a valid string.'),
    
      handleValidationErrors
    ];
    
    router.get('/', ValidateQueryFilters,async(req,res)=>{
        try{
        const { page = 1, size = 20, minPrice, maxPrice, state, city } = req.query;
        //pagination. Databases use zero based indexing
        //parsing to turn the params into a number
        limit = parseInt(size);
        const offset = (parseInt(page) - 1) * limit;

        //query filter object
        let where = {};
        //I'm storing this in the where object.. basically storing and sql statement that would be "SELECT * FROM spots WHERE price >= 100;""
        if(minPrice) where.price = { [Op.gte]: parseFloat(minPrice)};
        //Now Storing "SELECT * FROM spots WHERE price BETWEEN 100 AND 500" as where.price
        if(maxPrice) where.price = { ...where.price, [Op.gte]: parseFloat(minPrice)};
        if(city) where.city = city;
        if(state) where.state = state;

        const spots = await Spot.findAll({
            where, 
            limit,
            offset,
            include:[
                {
                    model: SpotImage,
                    attributes: ['url'], // we must use array here. sequelize requires. 
                    limit:1 //might want to add a preview image column later. I believe this jsut chooses one image. Not a designated image to preview
                }
            ]

            
        })
        // return a json object 
        return res.status(200).json({ Spots: spots, page, size });

    }catch(error){
        console.error('Error... could not fetch spots');
        return res.status(500).json({message: 'Error retrieving spots'})
    }
        

        

    })
    

    module.exports = router
