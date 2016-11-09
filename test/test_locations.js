import commonTests  from './common';
import * as CONST   from './constants';

const mandatory     = ['name', 'description', 'encodingType', 'location'];
const optional      = [];
const associations  = [CONST.things, CONST.historicalLocations];
const tester = commonTests('Locations', mandatory, optional, associations);


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
        tester.postError(done, body, 400);
      });
    });
  });
});
