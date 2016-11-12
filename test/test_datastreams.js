import commonTests  from './common';
import {
  datastreams,
  observedProperties,
  sensors,
  things
} from './constants';

const mandatory     = [
  'name',
  'description',
  'unitOfMeasurement',
// Issue #15 'observationType'
];
const optional      = ['phenomenonTime', 'resultTime'];
const associations  = [things, sensors, observedProperties];

commonTests(datastreams, mandatory, optional, associations);
