import commonTests  from './common';
import {
  datastreams,
  DatastreamsEntity
} from './constants';

import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR
} from '../src/errors';

const mandatory     = [
  'name',
  'description',
  'unitOfMeasurement',
  'observationType'
];
const optional      = ['phenomenonTime', 'resultTime'];

commonTests(datastreams, 8880, mandatory, optional).then(tester => {
  describe('Observations API - specific', () => {
    describe('Check invalid observationType', () => {
      it('should respond 400 if observationType is not valid', done => {
        const body = Object.assign({}, DatastreamsEntity, {
          observationType: 'random'
        });
        tester.postError(done, body, 400, ERRNO_VALIDATION_ERROR, BAD_REQUEST);
      });
    });
  });
});
