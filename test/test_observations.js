import commonTests  from './common';
import {
  observations
} from './constants';

const mandatory     = ['phenomenonTime', 'result', 'resultTime'];
// XXX #16 resultQuality
const optional      = ['validTime', 'parameters'];
const associations  = {
  'Datastreams': 'Datastream',
  'FeaturesOfInterest': 'FeaturesOfInterest'
};

commonTests(observations, mandatory, optional, associations);
