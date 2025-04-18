'use strict';
const { SpotImage} = require('../models')

let options = {};
if (process.env.NODE_ENV === 'production') {
 options.schema = process.env.SCHEMA; // define your schema in options object
}
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await SpotImage.bulkCreate( [
    {
      spotId: 1,
      url: "https://example.com/image1.jpg",
      preview: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      spotId: 1,
      url: "https://example.com/image2.jpg",
      preview: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      spotId: 2,
      url: "https://example.com/image3.jpg",
      preview: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      spotId: 3,
      url: "https://example.com/image4.jpg",
      preview: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      spotId: 3,
      url: "https://example.com/image5.jpg",
      preview: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete("SpotImages", null, {});
  }
};
