'use strict';

const { Review } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        userId: 1,
        spotId: 1,
        review: "Absolutely amazing place. Would visit again!",
        stars: 5
      },
      {
        userId: 2,
        spotId: 2,
        review: "Nice location, clean and well maintained.",
        stars: 4
      },
      {
        userId: 3,
        spotId: 3,
        review: "It was decent but a bit overpriced.",
        stars: 3
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Reviews', null, {});
  }
};
