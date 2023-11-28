// userModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const SessionModel = sequelize.define('session', {
  id: { // Session Id 
    type: DataTypes.TEXT,
    allowNull:false,
    primaryKey:true
  },
  content: { // encrypted Session Object
    type: DataTypes.TEXT, 
    allowNull:false
  },
  shop:{ // Store name of user
    type : DataTypes.TEXT,
    allowNull:false
  },
  serverKey:{ // Server Key of Store User
    type : DataTypes.TEXT,
    defaultValue:null
  }
});

module.exports =  SessionModel