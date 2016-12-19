import commonTests  from './common';
import db from '../src/models/db';
import {
  datastream,
  datastreams,
  DatastreamsEntity,
  entities,
  featureOfInterest,
  locations,
  LocationsEntity,
  observations,
  ObservationsEntity,
  things,
  ThingsEntity,
} from './constants';

import * as ERR from '../src/errors';

const mandatory     = [
  'phenomenonTime',
  'result'
];
// XXX #16 resultQuality
const optional      = ['validTime', 'parameters'];

commonTests(observations, 8885, mandatory, optional).then(tester => {
  describe('Observations specific tests', () => {
    beforeEach(done => {
      db().then(models => {
        models.sequelize.transaction(transaction => {
          return Promise.all(Object.keys(entities).map(name => {
            return models[name].destroy({ transaction, where: {} });
          }));
        }).then(() => done());
      });
    });

    describe('POST to association URL', () => {
      it('should return 201 when creating a Observation, pointing to an ' +
         'association URL', done => {
        db().then(models => {
          models[datastreams].create(DatastreamsEntity).then(relation => {
            let body = Object.assign({}, ObservationsEntity);
            Reflect.deleteProperty(body, datastream);
            const url = '/v1.0/Datastreams(' + relation.id + ')/Observations';
            tester.postSuccess(done, body, {
              'Observations': { count: 1 },
              'Datastreams': { count: 1 }
            }, url);
          });
        });
      });
    });

    describe('POST without FeatureOfInterest', () => {
      it('should return 400 if no inline Datastream.Location exist', done => {
        let body = Object.assign({}, ObservationsEntity);
        Reflect.deleteProperty(body, featureOfInterest);
        tester.postError(done, body, 400,
                         ERR.ERRNO_MANDATORY_ASSOCIATION_MISSING,
                         ERR.BAD_REQUEST);
      });

      it('should return 400 when assigning an existing Datastream without ' +
         'location', done => {
        db().then(models => {
          models[datastreams].create(DatastreamsEntity).then(relation => {
            let body = Object.assign({}, ObservationsEntity);
            body.Datastream = {
              '@iot.id': relation.id
            };
            Reflect.deleteProperty(body, featureOfInterest);
            tester.postError(done, body, 400,
                             ERR.ERRNO_MANDATORY_ASSOCIATION_MISSING,
                             ERR.BAD_REQUEST);
          });
        });
      });

      it('should return 201 if Datastream.Thing.Location exists', done => {
        let body = Object.assign({}, ObservationsEntity);
        Reflect.deleteProperty(body, featureOfInterest);
        body.Datastream.Thing.Locations = [Object.assign({}, LocationsEntity)];
        const countObject = {
          'Observations': { count: 1 },
          'Datastreams': { count: 1 },
          'FeaturesOfInterest': { count: 1 }
        }
        tester.postSuccess(done, body, countObject);
      });

      it('should return 201 when linking a Datastream with Location', done => {
        db().then(models => {
          const datastreamEntity = Object.assign({}, DatastreamsEntity);
          datastreamEntity.Thing.Locations = LocationsEntity;
          models[datastreams].create(datastreamEntity, {
            include: {
              model: models.Things, include: { model: models.Locations }
            }
          }).then(relation => {
            let body = Object.assign({}, ObservationsEntity);
            body.Datastream = {
              '@iot.id': relation.id
            };
            Reflect.deleteProperty(body, featureOfInterest);
            const countObject = {
              'Observations': { count: 1 },
              'Datastreams': { count: 1 },
              'FeaturesOfInterest': { count: 1 }
            }
            tester.postSuccess(done, body, countObject);
          });
        });
      });

      it('should return 201 when linking a Datastream entity with a linked ' +
         'Thing', done => {
        db().then(models => {
          const thingEntity = Object.assign({}, ThingsEntity);
          thingEntity.Locations = LocationsEntity;
          models[things].create(thingEntity, {
            include: [models.Locations]
          }).then(relation => {
            let body = Object.assign({}, ObservationsEntity);
            body.Datastream = Object.assign({}, DatastreamsEntity);
            body.Datastream.Thing = {
              '@iot.id': relation.id
            };
            Reflect.deleteProperty(body, featureOfInterest);
            const countObject = {
              'Observations': { count: 1 },
              'Datastreams': { count: 1 },
              'Things': { count: 1 },
              'FeaturesOfInterest': { count: 1 }
            }

            tester.postSuccess(done, body, countObject);
          });
        });
      });

      it('should return 201 when linking a Datastream entity with a linked ' +
         'Thing entity, and a Location id', done => {
        db().then(models => {
          const locationEntity = Object.assign({}, LocationsEntity);
          models[locations].create(locationEntity).then(relation => {
            let body = Object.assign({}, ObservationsEntity);
            body.Datastream = Object.assign({}, DatastreamsEntity);
            body.Datastream.Thing.Locations = [{
              '@iot.id': relation.id
            }];
            Reflect.deleteProperty(body, featureOfInterest);
            const countObject = {
              'Observations': { count: 1 },
              'Datastreams': { count: 1 },
              'Things': { count: 1 },
              'FeaturesOfInterest': { count: 1 }
            }

            tester.postSuccess(done, body, countObject);
          });
        });
      });
    })
  });
});
