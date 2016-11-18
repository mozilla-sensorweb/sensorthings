/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import {
  encodingTypes,
  featuresOfInterest
} from '../constants';

/**
 * 8.2.8 FeatureOfInterest Entity
 *
 * An Observation results in a value being assigned to a phenomenon.
 * The phenomenon is a property of a feature, the latter being the
 * FeatureOfInterest of the Observation [OGC and ISO 19156:2011].
 * In the context of the Internet of Things, many Observations’
 * FeatureOfInterest can be the Location of the Thing. For example,
 * the FeatureOfInterest of a wifi-connect thermostat can be the
 * Location of the thermostat (i.e., the living room where the
 * thermostat is located in). In the case of remote sensing, the
 * FeatureOfInterest can be the geographical area or volume that
 * is being sensed.
 *
 * Properties of a FeatureOfInterest entity:
 *
 * + name (CharacterString) (One - mandatory)
 *   A property provides a label for FeatureOfInterest entity,
 *   commonly a descriptive name.
 *
 * + description (CharacterString) (One - mandatory)
 *   The description about the FeatureOfInterest.
 *
 * + encodingType (ValueCode) (One - mandatory)
 *   The encoding type of the feature property.
 *
 * + feature (Any) (One - mandatory)
 *   The detailed description of the feature.
 *   The data type is defined by encodingType.
 *
 * Direct relation between a FeatureOfInterest entity and other
 * entity types:
 *
 * + Observation - One mandatory to many optional
 *   An Observation observes on one-and-only-one FeatureOfInterest.
 *   One FeatureOfInterest could be observed by zero-to-many Observations.
 *
 */

module.exports = (sequelize, DataTypes) => {
  const FeatureOfInterest = sequelize.define(featuresOfInterest, {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    encodingType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [[
          encodingTypes.GEO_JSON,
          encodingTypes.LOCATION_TYPE
        ]]
      }
    },
    feature: {
      type: DataTypes.GEOMETRY('POINT', 4326),
      allowNull: false
    }
  }, {
    classMethods: {
      associate: db => {
        FeatureOfInterest.hasMany(db.Observations);
      }
    },
    hooks: {
      beforeValidate: (data) => {
        if (data.feature) {
          data.feature.crs = {
            type: 'name',
            properties: { name: 'EPSG:4326' }
          };
        }
      }
    }
  });

  return FeatureOfInterest;
}
