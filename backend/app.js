// Import the express library for setting up the server
const express = require("express");
// Import express-async-errors to handle async route handler errors automatically
require("express-async-errors");
// Import morgan for logging HTTP requests and responses
const morgan = require("morgan");
// Import cors to enable Cross-Origin Resource Sharing (CORS) for API requests from different domains
const cors = require("cors");
// Import csurf for CSRF (Cross-Site Request Forgery) protection in the app
const csurf = require("csurf");
// Import helmet for security-related HTTP headers, helps protect from vulnerabilities
const helmet = require("helmet");
// Import cookie-parser to parse cookies sent with requests
const cookieParser = require("cookie-parser");

const { ValidationError } = require('sequelize');

const { environment } = require("./config");
const isProduction = environment === "production";

//initialize express app
const app = express();

//morgan middleware for logging infor about req and res's
app.use(morgan('dev'));


app.use(cookieParser());
app.use(express.json());

// Security Middleware
if (!isProduction) {
    // enable cors only in development
    app.use(cors());
  }
  
  // helmet helps set a variety of headers to better secure your app
  app.use(
    helmet.crossOriginResourcePolicy({
      policy: "cross-origin"
    })
  );
  
  // Set the _csrf token and create req.csrfToken method
  app.use(
    csurf({
      cookie: {
        secure: isProduction,
        sameSite: isProduction && "Lax",
        httpOnly: true
      }
    })
  );

  // backend/app.js
const routes = require('./routes');
app.use(routes); // Connect all the routes

// Catch unhandled requests and forward to error handler.
app.use((_req, _res, next) => {
    const err = new Error("The requested resource couldn't be found.");
    err.title = "Resource Not Found";
    err.errors = { message: "The requested resource couldn't be found." };
    err.status = 404;
    next(err);
  });

// Error formatter
app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    console.error(err);
    res.json({
      title: err.title || 'Server Error',
      message: err.message,
      errors: err.errors,
      stack: isProduction ? null : err.stack
    });
  });

module.exports = app;