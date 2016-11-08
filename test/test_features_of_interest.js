import commonTests  from './common';
import * as CONST   from './constants';

const mandatory     = ['name', 'description', 'encodingType', 'feature'];
const optional      = [];
const associations  = [CONST.observations];

const tester = commonTests(CONST.featuresOfInterest, mandatory, optional,
                           associations);
describe('FeaturesOfInterest API - specific', () => {
  describe('Check invalid ecodingTypes', () => {

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
        tester.postError(done, body, 400);
      });
    });
  });
});
