"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const jee_mark = sequelize.define(
    "jee_mark",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      BATCHNAME: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },
      ROLLNO: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: {
            args: [0, 10],
            msg: "Roll number must not exceed 10 characters",
          },
        },
      },
      Candidate_Name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: "Candidate name must not exceed 255 characters",
          },
        },
      },
      Test_Code: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: {
            args: [0, 15],
            msg: "Test code must not exceed 15 characters",
          },
        },
      },
      TOTAL: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Total must be a numeric value",
          },
        },
      },
      CORRECT: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Correct must be a numeric value",
          },
        },
      },
      WRONG: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Wrong must be a numeric value",
          },
        },
      },
      BLANK: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Blank must be a numeric value",
          },
        },
      },
      Phy_C: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Physics correct must be a numeric value",
          },
        },
      },
      Phy_W: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Physics wrong must be a numeric value",
          },
        },
      },
      Phy_B: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Physics blank must be a numeric value",
          },
        },
      },
      Che_C: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Chemistry correct must be a numeric value",
          },
        },
      },
      Che_W: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Chemistry wrong must be a numeric value",
          },
        },
      },
      Che_B: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Chemistry blank must be a numeric value",
          },
        },
      },
      Mat_C: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Mathematics correct must be a numeric value",
          },
        },
      },
      Mat_W: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Mathematics wrong must be a numeric value",
          },
        },
      },
      Mat_B: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Mathematics blank must be a numeric value",
          },
        },
      },
      Phy_Tot: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Physics total must be a numeric value",
          },
        },
      },
      che_Tot: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Chemistry total must be a numeric value",
          },
        },
      },
      Mat_Tot: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Mathematics total must be a numeric value",
          },
        },
      },
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      Total_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Total percentile must be a numeric value",
          },
          min: {
            args: [0],
            msg: "Total percentile must be at least 0",
          },
          max: {
            args: [100],
            msg: "Total percentile must not exceed 100",
          },
        },
      },
      Phy_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Physics percentile must be a numeric value",
          },
          min: {
            args: [0],
            msg: "Physics percentile must be at least 0",
          },
          max: {
            args: [100],
            msg: "Physics percentile must not exceed 100",
          },
        },
      },
      Che_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Chemistry percentile must be a numeric value",
          },
          min: {
            args: [0],
            msg: "Chemistry percentile must be at least 0",
          },
          max: {
            args: [100],
            msg: "Chemistry percentile must not exceed 100",
          },
        },
      },
      Mat_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "Mathematics percentile must be a numeric value",
          },
          min: {
            args: [0],
            msg: "Mathematics percentile must be at least 0",
          },
          max: {
            args: [100],
            msg: "Mathematics percentile must not exceed 100",
          },
        },
      },
      d_Total_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "District total percentile must be a numeric value",
          },
        },
      },
      d_Phy_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "District physics percentile must be a numeric value",
          },
        },
      },
      d_Che_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "District chemistry percentile must be a numeric value",
          },
        },
      },
      d_Mat_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        validate: {
          isFloat: {
            msg: "District mathematics percentile must be a numeric value",
          },
        },
      },
      CORANS: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: "CORANS must not exceed 255 characters",
          },
        },
      },
    },
    {
      tableName: "jee_marks",
      timestamps: true,
      indexes: [
        {
          fields: ["ROLLNO"],
        },
        {
          fields: ["Test_Code"],
        },
        {
          fields: ["BATCHNAME"],
        },
      ],
    }
  );

  jee_mark.associate = function (models) {
    // Define associations here if needed
    // Example:
    // jee_mark.belongsTo(models.test_master, {
    //   foreignKey: 'Test_Code',
    //   targetKey: 'testCode',
    //   as: 'test'
    // });
  };

  return jee_mark;
};
