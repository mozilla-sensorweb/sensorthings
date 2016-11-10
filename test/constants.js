/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with testConstants
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as Const from '../src/constants';

const json = {
  key: 'value'
};
const anotherjson = {
  key: 'anothervalue'
};

const testConstants = Object.assign({}, Const, {
  anotherlocation: {
    'type': 'Point',
    'coordinates': [114.05, 52.05]
  },
  anotherparameters: [anotherjson],
  anotherresult: anotherjson,
  anothertime: '2015-02-25T20:00:00.000Z',
  definition: 'definition',
  description: 'description',
  encodingTypes: Const.encodingTypes,
  location: {
    'type': 'Point',
    'coordinates': [-114.05, 51.05]
  },
  metadata: 'http://example.org/TMP35_36_37.pdf',
  name: 'name',
  navigationLink: '@iot.navigationLink',
  parameters: [json],
  result: json,
  time: '2015-01-25T20:00:00.000Z',
  unitOfMeasurement: {
    'symbol': '%',
    'name': 'Percentage',
    'definition': 'http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html'
  }
});

module.exports = Object.assign({}, testConstants, {
  DatastreamsEntity: {
    name: testConstants.name,
    description: testConstants.description,
    unitOfMeasurement: testConstants.unitOfMeasurement
  },
  FeaturesOfInterestEntity: {
    name: testConstants.name,
    description: testConstants.description,
    encodingType: testConstants.encodingTypes.GEO_JSON,
    get feature () {
      return Object.assign({}, testConstants.location);
    }
  },
  HistoricalLocationsEntity: {
    time: testConstants.time
  },
  LocationsEntity: {
    name: testConstants.name,
    description: testConstants.description,
    encodingType: testConstants.encodingTypes.GEO_JSON,
    get location () {
      return Object.assign({}, testConstants.location);
    }
  },
  ObservationsEntity: {
    phenomenonTime: testConstants.time,
    result: testConstants.result,
    resultTime: testConstants.time,
    validTime: testConstants.time,
    parameters: testConstants.parameters
  },
  ObservedPropertiesEntity: {
    name: testConstants.name,
    definition: testConstants.definition,
    description: testConstants.description
  },
  SensorsEntity: {
    name: testConstants.name,
    description: testConstants.description,
    encodingType: testConstants.encodingTypes.PDF,
    metadata: testConstants.metadata
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
