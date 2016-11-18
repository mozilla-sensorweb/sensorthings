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

commonTests(datastreams, 8880, mandatory, optional);
