'use strict';
module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('LinkMessageKeyword', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER
        },
        createdAt: {
          allowNull: true,
          type: DataTypes.DATE
        },
        keyword: {
          type: DataTypes.STRING,
          unique: 'messageKeyword'
        },
        messageId: {
          type: DataTypes.BIGINT,
          unique: 'messageKeyword'
        },
        weight: {
          type: DataTypes.FLOAT
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
            fields: ['keyword']
          }
        ]
      });
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('LinkMessageKeyword');
  }
};
