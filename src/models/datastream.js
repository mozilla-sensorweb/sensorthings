/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import { observationTypes } from '../constants';

/**
 * 8.2.4 Datastream Entity
 *
 * A Datastream groups a collection of Observations measuring the same
 * ObservedProperty and produced by the same Sensor.
 *
 * Properties of a Datastream entity:
 *
 * + name (CharacterString) (One - mandatory)
 *   A property provides a label for Datastream entity,
 *   commonly a descriptive name.
 *
 * + description (CharacterString) (One - mandatory)
 *   The description about the Datastream.
 *
 * + unitOfMeasurement (JSON Object) (One - mandatory)
 *   A JSON Object containing three key-value pairs. The name property
 *   presents the full name of the unitOfMeasurement; the symbol property
 *   shows the textual form of the unit symbol; and the definition contains
 *   the URI defining the unitOfMeasurement.
 *   The values of these properties SHOULD follow the Unified Code for Unit
 *   of Measure (UCUM).
 *
 * + observationType (ValueCode) (One - mandatory)
 *   The type of Observation (with unique result type), which is used by the
 *   service to encode observations.
 *   Can be OM_CategoryObservation (URI), OM_CountObservation (integer),
 *   OM_Measurement (double), OM_Observation (Any) or OM_TruthObservation
 *   (boolean).
 *
 * + observedArea (GM_Envelope - GeoJSON Polygon) (Zero-to-one - optional)
 *   The spatial bounding box of the spatial extent of all FeaturesOfInterest
 *   that belong to the Observations associated with this Datastream.
 *
 * + phenomenonTime (TM_Period - ISO 8601 Time Interval) (Zero-to-one optional)
 *   The temporal interval of the phenomenon times of all observations belonging
 *   to this Datastream.
 *
 * + resultTime (TM_Period - ISO 8601 Time Interval) (Zero-to-one optional)
 *   The temporal interval of the result times of all observations belonging to
 *   this Datastream.
 *
 * Direct relation between a Datastream entity and other
 * entity types:
 *
 * + Thing - Many optional to one mandatory
 *   A Thing has zero-to-many Datastreams. A Datastream entity SHALL only link
 *   to a Thing as a collection of Observations.
 *
 * + Sensor - Many optional to one mandatory
 *   The Observations in a Datastream are performed by one-and-only-one Sensor.
 *   One Sensor MAY produce zero-to-many Observations in different Datastreams.
 *
 * + ObservedProperty - Many optional to one mandatory
 *   The Observations of a Datastream SHALL observe the same ObservedProperty.
 *   The Observations of different Datastreams MAY observe the same
 *   ObservedProperty.
 *
 * + Observation - One mandatory to many optional
 *   A Datastream has zero-to-many Observations. One Observation SHALL occur in
 *   one-and-only-one Datastream.
 */

module.exports = (sequelize, DataTypes) => {
  const Datastream = sequelize.define('Datastreams', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    unitOfMeasurement: { type: DataTypes.JSONB, allowNull: false },
    // XXX  Define observationType property #15
    // observationType: { type: DataTypes.INTEGER, allowNull: false },
    observedArea: { type: DataTypes.GEOMETRY('POINT', 4326) },
    observationType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [ Object.keys(observationTypes).map(type => {
          return observationTypes[type];
        })]
      }
    },
    phenomenonTime: {
      type: DataTypes.DATE,
      get: function get() {
        const time = this.getDataValue('phenomenonTime');
        if (!time) {
          return;
        }
        return new Date(time).toISOString();
      },
      set: function set(value) {
        if (!value) {
          return this.setDataValue('phenomenonTime', null);
        }

        this.setDataValue('phenomenonTime', new Date(value).toISOString());
      }
    },
    resultTime: {
      type: DataTypes.DATE,
      get: function get() {
        const time = this.getDataValue('resultTime');
        if (!time) {
          return;
        }
        return new Date(time).toISOString();
      },
      set: function set(value) {
        if (!value) {
          return this.setDataValue('resultTime', null);
        }
        this.setDataValue('resultTime', new Date(value).toISOString());
      }
    }
  }, {
    classMethods: {
      associate: db => {
        Datastream.belongsTo(db.Things);
        Datastream.belongsTo(db.Sensors);
        Datastream.belongsTo(db.ObservedProperties);
        Datastream.hasMany(db.Observations);
      }
    }
  });

  return Datastream;
}
