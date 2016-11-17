import commonTests  from './common';
import * as CONST   from './constants';
import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR
} from '../src/errors';

const mandatory     = ['name', 'description', 'encodingType', 'feature'];
const optional      = [];

commonTests(CONST.featuresOfInterest, mandatory, optional).then(tester => {
  describe('FeaturesOfInterest API - specific', () => {
    describe('Check invalid encodingTypes', () => {

      [CONST.encodingTypes.UNKNOWN,
       CONST.encodingTypes.PDF,
       CONST.encodingTypes.TEXT_HTML,
       CONST.encodingTypes.SENSOR_ML,
       CONST.encodingTypes.TYPE_DESCRIPTION].forEach(type => {
        it('should respond 400 if encodingType is ' + type,
          done => {
          const body = Object.assign({}, CONST.FeaturesOfInterestEntity, {
            encodingType: type,
          });
          tester.postError(done, body, 400, ERRNO_VALIDATION_ERROR,
                           BAD_REQUEST);
        });
      });
    });
  });
});
