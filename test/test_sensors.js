import commonTests  from './common';
import * as CONST   from './constants';
import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR
} from '../src/errors';

const mandatory     = ['name', 'description', 'encodingType', 'metadata'];

commonTests(CONST.sensors, 8887, mandatory).then(tester => {
  describe('Sensors API - specific', () => {
    describe('Check invalid ecodingTypes', () => {

      [CONST.encodingTypes.UNKNOWN,
       CONST.encodingTypes.GEO_JSON,
       CONST.encodingTypes.TEXT_HTML,
       CONST.encodingTypes.LOCATION_TYPE].forEach(type => {
        it('should respond 400 if encodingType is ' + type,
          done => {
          const body = Object.assign({}, CONST.SensorsEntity, {
            encodingType: type,
          });
          tester.postError(done, body, 400, ERRNO_VALIDATION_ERROR,
                           BAD_REQUEST);
        });
      });
    });
  });
});
