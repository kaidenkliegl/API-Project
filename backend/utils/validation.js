// backend/utils/validation.js
const { validationResult } = require('express-validator');
const { check, query } = require("express-validator");

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, _res, next) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) { 
    const errors = {};
    validationErrors
      .array()
      .forEach(error => errors[error.path] = error.msg);

    const err = Error("Bad request.");
    err.errors = errors;
    err.status = 400;
    err.title = "Bad request.";
     next(err);
  }
  next();
};

const reviewValidation = [
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

module.exports = {
  handleValidationErrors, reviewValidation
};