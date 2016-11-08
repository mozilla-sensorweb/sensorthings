import commonTests  from './common';
import {
  datastreams,
  featuresOfInterest,
  observations
} from './constants';

const mandatory     = ['phenomenonTime', 'result', 'resultTime'];
// XXX #16 resultQuality
const optional      = ['validTime', 'parameters'];
const associations  = [datastreams, featuresOfInterest];

commonTests(observations, mandatory, optional, associations);
