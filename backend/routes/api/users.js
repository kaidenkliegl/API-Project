// backend/routes/api/users.js
const express = require('express')
const router = express.Router();
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth, restoreUser  } = require('../../utils/auth');
const { User } = require('../../db/models');


// Current Logged-in User
// GET /api/users/current
// Description: Returns the current logged-in user or null if not logged in
// Success Response (200):
// {
//   "user": {
//     "id": 1,
//     "firstName": "John",
//     "lastName": "Smith",
//     "email": "john.smith@gmail.com",
//     "username": "JohnSmith"
//   }
// }
// If no user is logged in:
// { "user": null }

router.get('/current', restoreUser, async(req, res) => {
  if(!req.user) {
    return res.json({ user: null});
  }
  const {id, firstName, lastName, email, username } = req.user;
  return res.json({
    user: { id, firstName, lastName, email, username}
  });

 
});

// Validate sign up Middleware
const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email.'),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.'),
  check('username')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors
];


// Sign up
// ===============================
// POST /api/users
// Description: Sign up a new user
// Request Body:
// {
//   "firstName": "John",
//   "lastName": "Smith",
//   "email": "john.smith@gmail.com",
//   "username": "JohnSmith",
//   "password": "secret password"
// }
// Success Response (201):
// {
//   "user": {
//     "id": 1,
//     "firstName": "John",
//     "lastName": "Smith",
//     "email": "john.smith@gmail.com",
//     "username": "JohnSmith"
//   }
// }
// Error Response (400 - Validation):
// {
//   "message": "Validation error",
//   "errors": {
//     "email": "Invalid email",
//     "username": "Username is required",
//     "firstName": "First Name is required",
//     "lastName": "Last Name is required"
//   }
// }
// Error Response (500 - User Exists):
// {
//   "message": "User already exists",
//   "errors": {
//     "email": "User with that email already exists",
//     "username": "User with that username already exists"
//   }
// }
// ===============================
router.post(
  '/',
  validateSignup,
  async (req, res) => {
    const { email, password, username } = req.body;
    const hashedPassword = bcrypt.hashSync(password);
    const user = await User.create({ email, username, hashedPassword });

    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    await setTokenCookie(res, safeUser);

    return res.status(201).json({
      user: safeUser
    });
  });


module.exports = router;