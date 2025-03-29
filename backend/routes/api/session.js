// backend/routes/api/session.js
const express = require('express')
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

  //check login username and password Middleware
  const validateLogin = [
    check('credential')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('Please provide a valid email or username.'),
    check('password')
      .exists({ checkFalsy: true })
      .withMessage('Please provide a password.'),
    handleValidationErrors
  ];

// Log in

// ===============================
// POST /api/session
// Description: Log in a user
// Request Body:
// {
//   "credential": "john.smith@gmail.com",
//   "password": "secret password"
// }
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
// Error Response (401 - Invalid Credentials):
// {
//   "message": "Login failed",
//   "errors": {
//     "credential": "The provided credentials were invalid."
//   }
// }
// Error Response (400 - Validation):
// {
//   "message": "Validation error",
//   "errors": {
//     "credential": "Please provide a valid email or username.",
//     "password": "Please provide a password."
//   }
// }
// ===============================
router.post(
  '/',
  validateLogin,
  async (req, res, next) => {
    const { credential, password } = req.body;

    const user = await User.unscoped().findOne({
      where: {
        [Op.or]: {
          username: credential,
          email: credential
        }
      }
    });

    if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
      const err = new Error('Login failed');
      err.status = 401;
      err.title = 'Login failed';
      err.errors = { credential: 'The provided credentials were invalid.' };
      return next(err);
    }

    const safeUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    };

    await setTokenCookie(res, safeUser);

    return res.json({
      user: safeUser
    });
  }
);

  // Log out
// ===============================
// DELETE /api/session
// Description: Log out the current user
// Success Response (200):
// { "message": "success" }
// ===============================
  router.delete(
    '/',
    (_req, res) => {
      res.clearCookie('token');
      return res.json({ message: 'success' });
    }
  );

  // Restore session user
// ===============================
// GET /api/session
// Description: Restore session user
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
// If not logged in:
// { "user": null }
// ===============================
router.get(
  '/',
  (req, res) => {
    const { user } = req;
    if (user) {
      const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
      };
      return res.json({
        user: safeUser
      });
    } else return res.json({ user: null });
  }
);





module.exports = router;