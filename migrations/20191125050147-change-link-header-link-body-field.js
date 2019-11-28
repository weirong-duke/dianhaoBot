'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    queryInterface.changeColumn(
      'linkmessage',
      'linkBody',
      {
        type: Sequelize.TEXT,
      }
    );
    return queryInterface.changeColumn(
      'linkmessage',
      'linkHeading',
      {
        type: Sequelize.TEXT,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    queryInterface.changeColumn(
      'linkmessage',
      'linkBody',
      {
        type: Sequelize.STRING,
      }
    );
    return queryInterface.changeColumn(
      'linkmessage',
      'linkHeading',
      {
        type: Sequelize.STRING,
      }
    );
  }
};
