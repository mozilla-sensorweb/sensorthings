/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * 8.2.1 Thing Entity
 *
 * The OGC SensorThings API follows the ITU-T definition, i.e., with
 * regard to the Internet of Things, a thing is an object of the physical
 * world (physical things) or the information world (virtual things) that
 * is capable of being identified and integrated into communication networks
 * [ITU-T Y.2060].
 *
 * Properties of a Thing entity:
 *
 * + name (CharacterString) (One - mandatory)
 *   A property provides a label for Thing entity, commonly a descriptive
 *   name.
 *
 * + description (CharacterString) (One - mandatory)
 *   This is a short description of the corresponding Thing entity.
 *
 * + properties (JSON Object) (Zero-to-one)
 *   A JSON Object containing user-annotated properties as key-value pairs.
 *
 * Direct relation between a Thing entity and other entity types:
 *
 * + Location - Many optional to many optional.
 *   The Location entity locates the Thing. Multiple Things MAY be located at
 *   the same Location. A Thing MAY not have a Location. A Thing SHOULD have
 *   only one Location.
 *   However, in some complex use cases, a Thing MAY have more than one Location
 *   representations. In such case, the Thing MAY have more than one Locations.
 *   These Locations SHALL have different encodingTypes and the encodingTypes
 *   SHOULD be in different spaces (e.g., one encodingType in Geometrical space
 *   and one encodingType in Topological space).
 *
 * + HistoricalLocation - One mandatory to many optional.
 *   A Thing has zero-to-many HistoricalLocations. A HistoricalLocation has
 *   one-and-only-one Thing.
 *
 * + DataStream - One mandatory to many optional.
 *   A Thing MAY have zero-to-many Datastreams.
 *
 */

module.exports = (sequelize, DataTypes) => {
  const Thing = sequelize.define('Things', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    properties: { type: DataTypes.JSONB }
  }, {
    classMethods: {
      associate: db => {
        Thing.belongsToMany(db.Locations, { through: 'ThingLocations' });
        Thing.hasMany(db.HistoricalLocations);
        Thing.hasMany(db.Datastreams);
        // When a Thing has a new Location, a new HistoricalLocation SHALL
        // be created and added to the Thing automatically by the service.
        // The current Location of the Thing SHALL only be added to
        // HistoricalLocation automatically by the service, and SHALL not
        // be created as HistoricalLocation directly by user.
        Thing.associations.Locations.afterAssociation =
          (transaction, instance, associationId) => {
          const historicalLocations =
            Thing.associations.HistoricalLocations;
          return instance[historicalLocations.accessors.create]({
            time: Date.now()
          }, { transaction }).then(historicalLocation => {
            const locations = db.HistoricalLocations.associations.Locations;
            return historicalLocation[locations.accessors.add](
              associationId, { transaction }
            );
          });
        };
      }
    }
  });

  return Thing;
}
