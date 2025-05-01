// backend/routes/api/index.js
const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const spotRouter = require('./spots');
const { restoreUser } = require("../../utils/auth.js");

// Apply restoreUser middleware first
router.use(restoreUser);

// Then mount your routers
router.use('/session', sessionRouter);
router.use('/users', usersRouter);
router.use('/spots', spotRouter);

// Test route
router.post('/test', function (req, res) {
  res.json({ requestBody: req.body });
});

module.exports = router;
