'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class candidateReviewremarks extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Example associations (uncomment and modify as needed):
      
      // Association with sub_master (if it exists)
      // candidateReviewremarks.belongsTo(models.sub_master, {
      //   foreignKey: 'subcode',
      //   targetKey: 'Subcode',
      //   as: 'subject'
      // });

      // Association with faculty (if it exists)
      // candidateReviewremarks.belongsTo(models.faculty, {
      //   foreignKey: 'eva_id',
      //   targetKey: 'Evaluator_Id',
      //   as: 'examiner'
      // });
    }
  }
  
  candidateReviewremarks.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    Dep_Name: {
      type: DataTypes.STRING(15),
      allowNull: true,
      comment: 'Department Name'
    },
    sec_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'Section ID'
    },
    barcode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Barcode identifier'
    },
    qbno: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      comment: 'Question Book Number'
    },
    subcode: {
      type: DataTypes.STRING(25),
      allowNull: false,
      comment: 'Subject Code'
    },
    section: {
      type: DataTypes.STRING(5),
      allowNull: false,
      comment: 'Section identifier'
    },
    sub_section: {
      type: DataTypes.STRING(5),
      allowNull: true,
      comment: 'Sub-section identifier'
    },
    add_sub_section: {
      type: DataTypes.STRING(5),
      allowNull: true,
      comment: 'Additional sub-section identifier'
    },
    reviewRemarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Review remarks from examiner'
    },
    reviewRemarks_data: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Additional review remarks data'
    },
    valuation_type: {
      type: DataTypes.STRING(1),
      allowNull: false,
      comment: 'Type of valuation (e.g., R=Regular, S=Supplementary)'
    },
    Examiner_type: {
      type: DataTypes.STRING(1),
      allowNull: false,
      comment: 'Type of examiner (e.g., C=Chief, E=External, I=Internal)'
    }
  }, {
    sequelize,
    modelName: 'candidateReviewremarks',
    tableName: 'candidateReviewremarks',
    timestamps: true,
    indexes: [
      {
        name: 'idx_candidate_reviewremarks_barcode',
        fields: ['barcode']
      },
      {
        name: 'idx_candidate_reviewremarks_subcode',
        fields: ['subcode']
      },
      {
        name: 'idx_candidate_reviewremarks_sec_id',
        fields: ['sec_id']
      }
    ]
  });

  return candidateReviewremarks;
};
