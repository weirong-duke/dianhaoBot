'use strict';
module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('LinkMessage', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      classification: {
        allowNull: true,
        type: DataTypes.STRING
      },
      createdAt: DataTypes.DATE,
      linkBody: {
        allowNull: true,
        type: DataTypes.STRING
      },
      linkHeading: {
        allowNull: true,
        type: DataTypes.STRING
      },
      messageId: {
        primaryKey: true,
        type: DataTypes.BIGINT
      },
      reactionCount: {
        defaultValue: 0,
        type: DataTypes.INTEGER
      },
      sentiment: {
        type: DataTypes.INTEGER
      },
      subsequentMessageCount: {
        defaultValue: 0,
        type: DataTypes.INTEGER
      },
      url: {
        type: DataTypes.STRING
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    },
      {
        freezeTableName: true,
        indexes: [
          {
            fields: ['url', 'createdAt']
          }
        ]
      });
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('LinkMessage');
  }
};
