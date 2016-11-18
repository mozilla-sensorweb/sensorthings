import commonTests  from './common';
import {
  observations,
  ObservationsEntity
} from './constants';

import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR
} from '../src/errors';

const mandatory     = [
  'phenomenonTime',
  'result',
  'resultTime',
  'observationType'
];
// XXX #16 resultQuality
const optional      = ['validTime', 'parameters'];

commonTests(observations, 8885, mandatory, optional).then(tester => {
  describe('Observations API - specific', () => {
    describe('Check invalid observationType', () => {
      it('should respond 400 if observationType is not valid', done => {
        const body = Object.assign({}, ObservationsEntity, {
          observationType: 'random'
        });
        tester.postError(done, body, 400, ERRNO_VALIDATION_ERROR, BAD_REQUEST);
      });
    });
  });
});
