'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Test_Master = sequelize.define(
    'Test_Master',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      testcode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          len: {
            args: [0, 20],
            msg: 'Test code must not exceed 20 characters'
          },
          notEmpty: {
            msg: 'Test code cannot be empty'
          }
        }
      },
      day: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      testdate: {
        type: DataTypes.STRING(25),
        allowNull: false,
        validate: {
          len: {
            args: [0, 25],
            msg: 'Test date must not exceed 25 characters'
          },
          notEmpty: {
            msg: 'Test date cannot be empty'
          }
        }
      },
      sessions: {
        type: DataTypes.STRING(15),
        allowNull: false,
        validate: {
          len: {
            args: [0, 15],
            msg: 'Sessions must not exceed 15 characters'
          },
          notEmpty: {
            msg: 'Sessions cannot be empty'
          }
        }
      },
      no_of_ques: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: {
            args: [0, 10],
            msg: 'Number of questions must not exceed 10 characters'
          }
        }
      },
      type_of_exam: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: {
            args: [0, 10],
            msg: 'Type of exam must not exceed 10 characters'
          }
        }
      },
      std: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: {
            args: [0, 10],
            msg: 'Standard must not exceed 10 characters'
          }
        }
      },
      exam_desc: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: {
            args: [0, 15],
            msg: 'Exam description must not exceed 15 characters'
          }
        }
      },
      flg: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: {
            args: [0, 15],
            msg: 'Flag must not exceed 15 characters'
          }
        }
      },
      checkflg: {
        type: DataTypes.STRING(15),
        allowNull: false,
        defaultValue: 'N',
        validate: {
          len: {
            args: [0, 15],
            msg: 'Check flag must not exceed 15 characters'
          }
        }
      },
      Img_Upload: {
        type: DataTypes.STRING(1),
        allowNull: false,
        defaultValue: 'N',
        validate: {
          len: {
            args: [0, 1],
            msg: 'Image upload flag must be 1 character'
          }
        }
      },
      Key_Upload: {
        type: DataTypes.STRING(1),
        allowNull: false,
        defaultValue: 'N',
        validate: {
          len: {
            args: [0, 1],
            msg: 'Key upload flag must be 1 character'
          }
        }
      },
      percentile_gen: {
        type: DataTypes.STRING(1),
        allowNull: false,
        defaultValue: 'N',
        validate: {
          len: {
            args: [0, 1],
            msg: 'Percentile generation flag must be 1 character'
          }
        }
      },
      Test_Name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          len: {
            args: [0, 50],
            msg: 'Test name must not exceed 50 characters'
          },
          notEmpty: {
            msg: 'Test name cannot be empty'
          }
        }
      },
      test_districts: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: {
            args: [0, 255],
            msg: 'Test districts must not exceed 255 characters'
          },
          notEmpty: {
            msg: 'Test districts cannot be empty'
          }
        }
      },
      repeaters: {
        type: DataTypes.STRING(1),
        allowNull: false,
        defaultValue: 'N',
        validate: {
          len: {
            args: [0, 1],
            msg: 'Repeaters flag must be 1 character'
          }
        }
      },
      image_upload_districts: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'Image upload districts must not exceed 255 characters'
          }
        }
      }
    },
    {
      tableName: 'testMaster',
      timestamps: true,
      underscored: false
    }
  );

  return Test_Master;
};
