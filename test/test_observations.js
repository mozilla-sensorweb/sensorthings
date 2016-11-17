import commonTests  from './common';
import {
  observations
} from './constants';

const mandatory     = ['phenomenonTime', 'result', 'resultTime'];
// XXX #16 resultQuality
const optional      = ['validTime', 'parameters'];

commonTests(observations, mandatory, optional);
