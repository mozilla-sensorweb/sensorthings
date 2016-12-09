import db          from '../src/models/db';
import commonTests from './common';
import * as CONST  from './constants';

const mandatory = ['name', 'description'];
const optional = ['properties'];

commonTests(CONST.things, 8888, mandatory, optional).then(tester => {
  describe('Things API - specific', () => {
    describe('Get FeaturesOfInterest from Locations', () => {
      beforeEach(done => {
        db().then(models => {
          models.sequelize.transaction(transaction => {
            return Promise.all(Object.keys(CONST.entities).map(name => {
              return models[name].destroy({ transaction, where: {} });
            }));
          }).then(() => done());
        });
      });

      it('should respond 201 when inserting a Thing with a Observation ' +
         'FeatureOfInterest, but with Locations', done => {
        const body = Object.assign({}, CONST.ThingsEntity, {
          'Datastreams': [Object.assign({}, CONST.DatastreamsEntity, {
            'Observations': [Object.assign({}, CONST.ObservationsEntity, {
              'FeatureOfInterest': undefined,
              'Datastream': undefined
            }), Object.assign({}, CONST.ObservationsEntity, {
              'FeatureOfInterest': undefined,
              'Datastream': undefined
            })],
            'Thing': undefined
          }), Object.assign({}, CONST.DatastreamsEntity, {
            'Observations': [Object.assign({}, CONST.ObservationsEntity, {
              'FeatureOfInterest': undefined,
              'Datastream': undefined
            })],
            'Thing': undefined
          })],
          'Locations': [Object.assign({}, CONST.LocationsEntity)],
        });
        tester.postSuccess(done, body, {
          'Datastreams': { count: 2 },
          'Things': { count: 1 },
          'Locations': { count: 1 },
          'FeaturesOfInterest': { count: 3 },
          'Observations': { count: 3 },
          'Sensors': { count: 2 }
        });
      });
    });
  });
});
