'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'linkmessage',
      'tfIdfIndex',
      {
        allowNull: true,
        type: Sequelize.INTEGER
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('linkmessage', 'tfIdfIndex');
  }
};
