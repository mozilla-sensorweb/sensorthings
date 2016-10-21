/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * 8.2.6 ObservedProperty Entity
 *
 * An ObservedProperty specifies the phenomenon of an Observation.
 *
 * Properties of an ObservedProperty entity:
 *
 * + name (CharacterString) (One - mandatory)
 *   A property provides a label for ObservedProperty entity,
 *   commonly a descriptive name.
 *
 * + definition (URI) (One - mandatory)
 *   The URI of the ObservedProperty. Dereferencing this URI SHOULD
 *   result in a representation of the definition of the ObservedProperty.
 *
 * + description (CharacterString) (One - mandatory)
 *   The description about the ObservedProperty.
 *
 * Direct relation between an ObservedProperty entity and other entity types:
 *
 * + Datastream - One mandatory to many optional
 *   The Observations of a Datastream observe the same ObservedProperty.
 *   The Observations of different Datastreams MAY observe the same
 *   ObservedProperty.
 *
 */

module.exports = (sequelize, DataTypes) => {
  const ObservedProperty = sequelize.define('ObservedProperties', {
    name: { type: DataTypes.STRING(255), allowNull: false },
    definition: {
      type: DataTypes.TEXT,
      allowNull: false,
      validation: {
        isUrl: true
      }
    },
    description: { type: DataTypes.STRING(500), allowNull: false },
  });

  return ObservedProperty;
}
