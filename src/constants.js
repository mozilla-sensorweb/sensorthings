/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const navigationLink = '@iot.navigationLink';

export const encodingTypes = {
  UNKNOWN: 'unknown',
  GEO_JSON: 'application/vnd.geo+json',
  PDF: 'application/pdf',
  SENSOR_ML: 'http://www.opengis.net/doc/IS/SensorML/2.0',
  TEXT_HTML: 'text/html',
  LOCATION_TYPE: 'http://example.org/location_types#GeoJSON',
  TYPE_DESCRIPTION: 'http://schema.org/description'
};

export const datastreams               = 'Datastreams';
export const datastreamsNavigationLink = datastreams + navigationLink;

export const iotCount      = '@iot.count';
export const iotId         = '@iot.id';
export const iotSelfLink   = '@iot.selfLink';
