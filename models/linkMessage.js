'use strict';
module.exports = (sequelize, DataTypes) => {
  const LinkMessage = sequelize.define('LinkMessage', {
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
    tfIdfIndex: {
      allowNull: true,
      type: DataTypes.INTEGER
    },
    url: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    indexes: [
      {
        fields: ['url', 'createdAt']
      }
    ]
  });
  LinkMessage.associate = function(models) {
    // associations can be defined here
  };
  return LinkMessage;
};
