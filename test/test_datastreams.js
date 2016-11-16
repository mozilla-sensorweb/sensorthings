import commonTests  from './common';
import {
  datastreams
} from './constants';

const mandatory     = [
  'name',
  'description',
  'unitOfMeasurement',
// Issue #15 'observationType'
];
const optional      = ['phenomenonTime', 'resultTime'];
const associations  = {
  'Things': 'Thing',
  'Sensors': 'Sensor',
  'ObservedProperties': 'ObservedProperty',
  'Observations': 'Observations'
};

commonTests(datastreams, mandatory, optional, associations);
