/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with testConstants
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as Const from '../src/constants';

const testConstants = Object.assign({}, Const, {
  anotherName: 'anotherName',
  description: 'description',
  encodingTypes: Const.encodingTypes,
  metadata: 'http://example.org/TMP35_36_37.pdf',
  name: 'name',
  unitOfMeasurement: {
    'symbol': '%',
    'name': 'Percentage',
    'definition': 'http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html'
  },
  point: {
    'type': 'Point',
    'coordinates': [-114.05, 51.05]
  },
  time: '2015-01-25T20:00:00.000Z',
  anotherTime: '2015-02-25T20:00:00.000Z'
});

module.exports = Object.assign({}, testConstants, {
  sensorEntity: {
    name: testConstants.name,
    description: testConstants.description,
    encodingType: testConstants.encodingTypes.PDF,
    metadata: testConstants.metadata
  },
  datastreamEntity: {
    name: testConstants.name,
    description: testConstants.description,
    unitOfMeasurement: testConstants.unitOfMeasurement
  },
  locationEntity: {
    name: testConstants.name,
    description: testConstants.description,
    encodingType: testConstants.encodingTypes.GEO_JSON,
    location: Object.assign({}, testConstants.point)
  },
  historicalLocationEntity: {
    time: testConstants.time
  }
});
