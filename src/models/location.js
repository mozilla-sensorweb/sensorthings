/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

import { encodingTypes } from '../constants';

/**
 * 8.2.2 Location
 *
 * The Location entity locates the Thing or the Things it associated with.
 * A Thing’s Location entity is defined as the last known location of the Thing.
 * A Thing’s Location may be identical to the Thing’s Observations’
 * FeatureOfInterest. In the context of the IoT, the principle location of
 * interest is usually associated with the location of the Thing, especially
 * for in-situ sensing applications. For example, the location of interest of a
 * wifi-connected thermostat should be the building or the room in which the
 * smart thermostat is located. And the FeatureOfInterest of the Observations
 * made by the thermostat (e.g., room temperature readings) should also be the
 * building or the room. In this case, the content of the smart thermostat’s
 * location should be the same as the content of the temperature readings’
 * feature of interest.
 * However, the ultimate location of interest of a Thing is not always the
 * location of the Thing (e.g., in the case of remote sensing). In those use
 * cases, the content of a Thing’s Location is different from the content of
 * theFeatureOfInterestof the Thing’s Observations.
 * Section 7.1.4 of [OGC 10-004r3 and ISO 19156:2011] provides a detailed
 * explanation of observation location.
 *
 * Properties of a Location entity:
 *
 * + name (CharacterString) (One - mandatory)
 *   A property provides a label for Location entity,
 *   commonly a descriptive name.
 *
 * + description (CharacterString) (One - mandatory)
 *   The description about the Location.
 *
 * + encodingType (ValueCode) (One - mandatory)
 *   The encoding type of the Location property.
 *
 * + location (Any) (One - mandatory)
 *   The location type is defined by encodingType.
 *
 * Direct relation between a Location entity and other entity types:
 *
 * + Thing - Many optional to many optional
 *   Multiple Things MAY locate at the same Location.
 *   A Thing MAY not have a Location.
 *
 * + HistoricalLocation - Many mandatory to many optional
 *   A Location can have zero-to-many HistoricalLocations.
 *   One HistoricalLocation SHALL have one or many Locations.
 *
 */

module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Locations', {
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    encodingType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [[ encodingTypes.GEO_JSON ]]
      }
    },
    location: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false }
  }, {
    classMethods: {
      associate: db => {
        Location.belongsToMany(db.Things, { through: 'ThingLocations' });
        Location.belongsToMany(db.HistoricalLocations, {
          through: 'HistoricalLocationsLocations'
        });
      }
    }
  });

  return Location;
}
