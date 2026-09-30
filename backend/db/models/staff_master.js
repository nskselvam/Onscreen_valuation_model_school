'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class staff_master extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  
  staff_master.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    Eva_Id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    FACULTY_NAME: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    DIVISION: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    DESIGNATION: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Mobile_Number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Email_Id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    EMPLOYEE_CATEGORY: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    SUPERVISOR_OFFICENAME: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Faculty: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    campus_details: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    flg: {
      type: DataTypes.STRING(1),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'staff_master',
    tableName: 'staff_master',
    timestamps: true,
    indexes: [
      {
        name: 'Eva_Id_staff_idx',
        fields: ['Eva_Id']
      }
    ]
  });
  
  return staff_master;
};
