/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// List of supported encoding types

exports.EncodingTypes = {
  UNKNOWN: {
    code: 0,
    value: 'unknown'
  },
  GEO_JSON: {
    code: 1,
    value: 'application/vnd.geo+json'
  },
  PDF: {
    code: 2,
    value: 'application/pdf'
  },
  SENSOR_ML: {
    code: 3,
    value: 'http://www.opengis.net/doc/IS/SensorML/2.0'
  },
  TEXT_HTML: {
    code: 4,
    value: 'text/html'
  },
  LOCATION_TYPE: {
    code: 5,
    value: 'http://example.org/location_types#GeoJSON'
  },
  TYPE_DESCRIPTION: {
    code: 6,
    value: 'http://schema.org/description'
  }
};
