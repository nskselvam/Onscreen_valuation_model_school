'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Vacancy_Master = sequelize.define(
    'Vacancy_Master',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      Vac_Status: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      Catgegory: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'Category must not exceed 255 characters'
          }
        }
      },
      Vacancy: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      sex: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      pstm: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      Student_Status: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      Com: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      ph: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      seq: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      REM: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: 'REM must not exceed 50 characters'
          }
        }
      },
      REM1: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: 'REM1 must not exceed 50 characters'
          }
        }
      },
      REM2: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: 'REM2 must not exceed 50 characters'
          }
        }
      },
      REM3: {
        type: DataTypes.STRING(35),
        allowNull: true,
        validate: {
          len: {
            args: [0, 35],
            msg: 'REM3 must not exceed 35 characters'
          }
        }
      },
      Vacancy_Type: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      Center_Type: {
        type: DataTypes.STRING(25),
        allowNull: true,
        validate: {
          len: {
            args: [0, 25],
            msg: 'Center Type must not exceed 25 characters'
          }
        }
      },
      Zone_Code: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      Zone_Name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: 'Zone Name must not exceed 50 characters'
          }
        }
      },
      student_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
          len: {
            args: [0, 50],
            msg: 'Student type must not exceed 50 characters'
          }
        }
      },
      dCode: {
        type: DataTypes.STRING(2),
        allowNull: true,
        validate: {
          len: {
            args: [0, 2],
            msg: 'District code must not exceed 2 characters'
          }
        }
      },
      vacancyStd: {
        type: DataTypes.STRING(2),
        allowNull: true,
        validate: {
          len: {
            args: [0, 2],
            msg: 'Vacancy Standard must not exceed 2 characters'
          }
        }
      },
      filledVacancy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      vac: {
        type: DataTypes.INTEGER,  
        allowNull: true
      }
    },
    {
      tableName: 'Vacancy_Masters',
      timestamps: true,
      underscored: false
    }
  );

  return Vacancy_Master;
};
