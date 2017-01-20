/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * 8.2.3 HistoricalLocation Entity
 *
 * A Thing’s HistoricalLocation entity set provides the times of the current
 * (i.e., last known) and previous locations of the Thing.
 *
 *  Properties of a HistoricalLocation entity:
 *
 *  + time (TM_Instant ISO-8601 Time String) (One - mandatory)
 *    The time when the Thing is known at the Location.
 *
 *  Direct relation between an HistoricalLocation entity and other entity types:
 *
 *  + Location - Many optional to many mandatory
 *    A Location can have zero-to-many HistoricalLocations.
 *    One HistoricalLocation SHALL have one or many Locations.
 *
 *  + Thing - Many optional to one mandatory
 *    A HistoricalLocation has one-and-only-one Thing.
 *    One Thing MAY have zero-to-many HistoricalLocations.
 *
 */

module.exports = (sequelize, DataTypes) => {
  const HistoricalLocation = sequelize.define('HistoricalLocations', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clientId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
      get: function get () {
        const time = this.getDataValue('time');
        if (!time) {
          return;
        }
        return new Date(time).toISOString();
      },
      set: function set (value) {
        if (!value) {
          return;
        }
        this.setDataValue('time', new Date(value).toISOString())
      }
    }
  }, {
    classMethods: {
      associate: db => {
        HistoricalLocation.belongsTo(db.Things);
        HistoricalLocation.belongsToMany(db.Locations, {
          through: 'HistoricalLocationsLocations'
        });
      }
    },
    indexes: [{
      fields: ['clientId']
    }, {
      fields: ['userId']
    }, {
      fields: ['clientId', 'userId']
    }]
  });

  return HistoricalLocation;
}
