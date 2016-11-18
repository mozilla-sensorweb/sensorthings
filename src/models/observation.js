/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import { observationTypes } from '../constants';

/**
 * 8.2.7 Observation
 *
 * An Observation is the act of measuring or otherwise determining the value of
 * a property [OGC 10-004r3 and ISO 19156:2011].
 *
 * Properties of an Observation entity:
 *
 * + phenomenonTime (TM_Period - ISO 8601 Time Interval) (One - mandatory)
 *   The time instant or period of when the Observation happens.
 *   Note: Many resource-constrained sensing devices do not have a clock.
 *   As a result, a client may omit phenonmenonTime when POST new Observations,
 *   even though phenonmenonTime is a mandatory property. When a SensorThings
 *   service receives a POST Observations without phenonmenonTime, the service
 *   SHALL assign the current server time to the value of the phenomenonTime.
 *
 * + result (Any) (One - mandatory)
 *   The estimated value of an ObservedProperty from the Observation.
 *
 * + resultTime (TM_Period - ISO 8601 Time Interval) (One - mandatory)
 *   The time of the Observation's result was generated.
 *   Note: Many resource-constrained sensing devices do not have a clock.
 *   As a result, a client may omit resultTime when POST new Observations,
 *   even though resultTime is a mandatory property. When a SensorThings service
 *   receives a POST Observations without resultTime, the service SHALL assign
 *   a null value to the resultTime.
 *
 * + resultQuality (DQ_Element) (Zero-to-many)
 *   Describes the quality of the result.
 *
 * + validTime (TM_Period - USON 8601 Time Interval) (Zero-to-one)
 *   The time period during which the result may be used.
 *
 * + parameters (NamedValues in a JSON Array) (Zero-to-one)
 *   Key-value pairs showing the environmental conditions during measurement.
 *
 * Direct relation between an Observation entity and other entity types:
 *
 * + Datastream - Many optional to one mandatory
 *   A Datastream can have zero-to-many Observations. One Observation SHALL
 *   occur in one-and-only-one Datastream.
 *
 * + FeatureOfInterest - Many optional to one mandatory
 *   An Observation observes on one-and-only-one FeatureOfInterest. One
 *   FeatureOfInterest could be observed by zero-to-many Observations.
 */

module.exports = (sequelize, DataTypes) => {
  const Observation = sequelize.define('Observations', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    phenomenonTime: {
      type: DataTypes.DATE,
      allowNull: false,
      get: function get() {
        const time = this.getDataValue('phenomenonTime');
        if (!time) {
          return;
        }
        return new Date(time).toISOString();
      },
      set: function set(value) {
        if (!value) {
          return;
        }
        this.setDataValue('phenomenonTime', new Date(value).toISOString());
      }
    },
    observationType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [ Object.values(observationTypes) ]
      }
    },
    result: { type: DataTypes.JSONB, allowNull: false },
    resultTime: {
      type: DataTypes.DATE,
      allowNull: false,
      get: function get() {
        const time = this.getDataValue('resultTime');
        if (!time) {
          return;
        }
        return new Date(time).toISOString();
      },
      set: function set(value) {
        if (!value) {
          return;
        }
        this.setDataValue('resultTime', new Date(value).toISOString());
      }
    },
    // XXX Define resultQuality property #16
    // resultQuality: {},
    validTime: {
      type: DataTypes.DATE,
      get: function get() {
        const time = this.getDataValue('validTime');
        if (!time) {
          return;
        }
        return new Date(time).toISOString();
      },
      set: function set(value) {
        if (!value) {
          return;
        }
        this.setDataValue('validTime', new Date(value).toISOString());
      }
    },
    parameters: { type: DataTypes.ARRAY(DataTypes.JSON) }
  }, {
    classMethods: {
      associate: db => {
        Observation.belongsTo(db.Datastreams);
        Observation.belongsTo(db.FeaturesOfInterest);
      }
    }
  });

  return Observation;
}
