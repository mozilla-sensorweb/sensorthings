/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with testConstants
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as Const from '../src/constants';

const testConstants = Object.assign({}, Const, {
  definition: 'definition',
  name: 'name',
  description: 'description',
  encodingTypes: Const.encodingTypes,
  metadata: 'http://example.org/TMP35_36_37.pdf',
  unitOfMeasurement: {
    'symbol': '%',
    'name': 'Percentage',
    'definition': 'http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html'
  },
  location: {
    'type': 'Point',
    'coordinates': [-114.05, 51.05]
  },
  anotherlocation: {
    'type': 'Point',
    'coordinates': [114.05, 52.05]
  },
  time: '2015-01-25T20:00:00.000Z',
  anothertime: '2015-02-25T20:00:00.000Z',
  navigationLink: '@iot.navigationLink'
});

module.exports = Object.assign({}, testConstants, {
  SensorsEntity: {
    name: testConstants.name,
    description: testConstants.description,
    encodingType: testConstants.encodingTypes.PDF,
    metadata: testConstants.metadata
  },
  DatastreamsEntity: {
    name: testConstants.name,
    description: testConstants.description,
    unitOfMeasurement: testConstants.unitOfMeasurement
  },
  LocationsEntity: {
    name: testConstants.name,
    description: testConstants.description,
    encodingType: testConstants.encodingTypes.GEO_JSON,
    get location () {
      return Object.assign({}, testConstants.location);
    }
  },
  HistoricalLocationsEntity: {
    time: testConstants.time
  },
  ObservedPropertiesEntity: {
    name: testConstants.name,
    definition: testConstants.definition,
    description: testConstants.description
  },
  ThingsEntity: {
    name: testConstants.name,
    description: testConstants.description,
    properties: {
      property1: 'it’s waterproof',
      property2: 'it glows in the dark',
      property3: 'it repels insects'
    }
  }
});
