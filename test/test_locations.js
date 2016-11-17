import commonTests  from './common';
import * as CONST   from './constants';
import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR
} from '../src/errors';

const mandatory     = ['name', 'description', 'encodingType', 'location'];

commonTests('Locations', mandatory).then(tester => {
  describe('Locations API - specific', () => {
    describe('Check invalid ecodingTypes', () => {
      [CONST.encodingTypes.UNKNOWN,
       CONST.encodingTypes.PDF,
       CONST.encodingTypes.TEXT_HTML,
       CONST.encodingTypes.LOCATION_TYPE].forEach(type => {
        it('should respond 400 if encodingType is ' + type,
          done => {
          const body = Object.assign({}, CONST.LocationsEntity, {
            encodingType: type,
          });
          tester.postError(done, body, 400, ERRNO_VALIDATION_ERROR,
                           BAD_REQUEST);
        });
      });
    });
  });
});
