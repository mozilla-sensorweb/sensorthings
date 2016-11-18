/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export const navigationLink = '@iot.navigationLink';

export const datastreams = 'Datastreams';
export const datastreamsNavigationLink = datastreams + navigationLink;

export const featuresOfInterest = 'FeaturesOfInterest';
export const featuresOfInterestNavitationLink =
  featuresOfInterest + navigationLink;

export const historicalLocations = 'HistoricalLocations';
export const historicalLocationsNavigationLink =
  historicalLocations + navigationLink;

export const locations = 'Locations';
export const locationsNavigationLink = locations + navigationLink;

export const observations = 'Observations';
export const observationsNavigationLink = observations + navigationLink;

export const observedProperty   = 'ObservedProperty';
export const observedProperties = 'ObservedProperties';
export const observedPropertiesNavigationLink =
  observedProperties + navigationLink;

export const sensors = 'Sensors';
export const sensorsNavigationLink = sensors + navigationLink;

export const things = 'Things';
export const thingsNavigationLink = things + navigationLink;

export const entities = [
  datastreams,
  featuresOfInterest,
  historicalLocations,
  locations,
  observations,
  observedProperties,
  sensors,
  things
];

export const datastreamId = 'DatastreamId';
export const thingId = 'ThingId';
export const sensorId = 'SensorId';
export const observedPropertyId = 'ObservedPropertyId';
export const featuresOfInterestId = 'FeaturesOfInterestId';

export const createdAt = 'createdAt';
export const updatedAt = 'updatedAt';
export const commonExcludedFields = [createdAt, updatedAt];
export const excludedFields = {
  'Datastreams': commonExcludedFields.concat([thingId, sensorId,
                                              observedPropertyId]),
  'FeaturesOfInterest': commonExcludedFields,
  'HistoricalLocations': commonExcludedFields.concat([thingId]),
  'Locations': commonExcludedFields,
  'Observations': commonExcludedFields.concat([featuresOfInterestId,
                                               datastreamId]),
  'ObservedProperties': commonExcludedFields,
  'Sensors': commonExcludedFields,
  'Things': commonExcludedFields,
};

export const encodingTypes = {
  UNKNOWN: 'unknown',
  GEO_JSON: 'application/vnd.geo+json',
  PDF: 'application/pdf',
  SENSOR_ML: 'http://www.opengis.net/doc/IS/SensorML/2.0',
  TEXT_HTML: 'text/html',
  LOCATION_TYPE: 'http://example.org/location_types#GeoJSON',
  TYPE_DESCRIPTION: 'http://schema.org/description'
};

export const iotCount = '@iot.count';
export const iotId = '@iot.id';
export const iotSelfLink = '@iot.selfLink';

export const hasMany = 'HasMany';
export const hasOne = 'HasOne';
export const belongsTo = 'BelongsTo';
export const belongsToMany = 'BelongsToMany';
