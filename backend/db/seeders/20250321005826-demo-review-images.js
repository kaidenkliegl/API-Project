'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert("ReviewImages", [
      {
        reviewId: 1,  // Make sure this ID exists in the Reviews table
        url: "https://example.com/review-image1.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        reviewId: 2,  // Make sure this ID exists in the Reviews table
        url: "https://example.com/review-image2.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        reviewId: 3,
        url: "https://example.com/review-image3.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("ReviewImages", null, {});
  },
};