'use strict';
module.exports = (sequelize, DataTypes) => {
  const LinkMessageKeyword = sequelize.define('LinkMessageKeyword', {
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
    }
  }, {
    freezeTableName: true,
    indexes: [
      {
        fields: ['keyword']
      }
    ]
  });
  LinkMessageKeyword.associate = function(models) {
    // associations can be defined here
  };
  return LinkMessageKeyword;
};
