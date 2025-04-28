// backend/config/index.js
module.exports = {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8000,
  dbFile: 'db/dev.sqlite3',
  jwtConfig: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  }
};