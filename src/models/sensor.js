/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import { encodingTypes } from '../constants';

/**
 * 8.2.1 Sensor Entity
 *
 * A Sensor is an instrument that observes a property or phenomenon with the
 * goal of producing an estimate of the value of the property.
 *
 * Properties of a Sensor entity:
 *
 * + name (CharacterString) (One - mandatory)
 *   A property provides a label for Thing entity, commonly a descriptive
 *   name.
 *
 * + description (CharacterString) (One - mandatory)
 *   This is a short description of the corresponding Thing entity.
 *
 * + encodingType (ValueCode) (One - mandatory)
 *   The encoding type of the metadata property.
 *
 * + metadata (Any) (One - mandatory)
 *   The detailed description of the Sensor or system.
 *   The metadata type is defined by encodingType.
 *
 * Direct relation between a Thing entity and other entity types:
 *
 * + Datastream - One mandatory to many optional
 *   The Observations of a Datastream are measured with the same Sensor.
 *   One Sensor MAY produce zero-to-many Observations in different Datastreams.
 *
 */

module.exports = (sequelize, DataTypes) => {
  const Sensor = sequelize.define('Sensors', {
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    encodingType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [[
          encodingTypes.SENSOR_ML,
          encodingTypes.PDF,
          // The spec at
          // http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#table_15
          // does not include 'description' as a valid encoding type,
          // but SensorUp and Gost recognized this one a valid encoding type.
          encodingTypes.TYPE_DESCRIPTION
        ]]
      }
    },
    metadata: { type: DataTypes.STRING(255), allowNull: false }
  }, {
    classMethods: {
      associate: db => {
        Sensor.hasMany(db.Datastreams, { as: 'datastreams' });
      }
    }
  });

  return Sensor;
}
