import db          from '../src/models/db';
import commonTests from './common';
import * as CONST  from './constants';
import * as ERR    from '../src/errors';
import should      from 'should';

const mandatory = ['name', 'description'];
const optional = ['properties'];

commonTests(CONST.things, 8888, mandatory, optional).then(tester => {
  describe('Things API - specific', () => {

    beforeEach(done => {
      db().then(models => {
        models.sequelize.transaction(transaction => {
          return Promise.all(Object.keys(CONST.entities).map(name => {
            return models[name].destroy({ transaction, where: {} });
          }));
        }).then(() => done());
      });
    });

    describe('Locations with same encodingType', () => {
      let id;
      beforeEach(done => {
        db().then(models => {
          let thingEntity = Object.assign({}, CONST.ThingsEntity);
          thingEntity.Locations = [Object.assign({}, CONST.LocationsEntity)];
          models[CONST.things].create(thingEntity, {
            include: [models[CONST.locations]]
          }).then(instance => {
            id = instance.id;
            done();
          });
        });
      });

      it('should not allow to create 2 Locations related to same thing with ' +
         'the same encodingType'
         , done => {
        let body = Object.assign({}, CONST.LocationsEntity);
        tester.server.post('/v1.0/Things(' + id + ')/Locations').send(body)
        .expect('Content-Type', /json/)
        .expect(400)
        .end((err, res) => {
          const badRequestError = ERR.errors[ERR.BAD_REQUEST];
          const sameEncodingErrno = ERR.ERRNO_LOCATION_SAME_ENCODING_TYPE;
          should.not.exist(err);
          res.status.should.be.equal(400);
          res.body.code.should.be.equal(400);
          res.body.errno.should.be.equal(ERR.errnos[sameEncodingErrno]);
          res.body.error.should.be.equal(badRequestError);
          done();
        });
      });

      it('should replace the association when patching a Thing with a new ' +
         'Location with the same encodingType', done => {
        db().then(models => {
          const loc = Object.assign({}, CONST.LocationsEntity);
          models.Locations.create(loc).then(locInstance => {
            let body = {
              Locations: [
                { '@iot.id': locInstance.id }
              ]
            };
            tester.server.patch('/v1.0/Things(' + id + ')').send(body)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              res.status.should.be.equal(200);
              models.Locations.findAndCountAll({
                include: {
                  model: models.Things,
                  where: { id: id }
                }
              }).then(result => {
                result.count.should.be.equal(1);
                result.rows[0].id.should.be.equal(locInstance.id);
                done();
              });
            });
          });
        });
      });
    });

    describe('HistoricalLocations', () => {
      it('should create a new HistoricalLocations when patching the Thing ' +
         'with a new Location', done => {
        let body = Object.assign({}, CONST.ThingsEntity);
        body.Locations = [Object.assign({}, CONST.LocationsEntity)];
        tester.server.post('/v1.0/Things').send(body)
        .expect('Content-Type', /json/)
        .expect(201)
        .end((err, res) => {
          should.not.exist(err);
          db().then(models => {
            models.Locations.create(CONST.LocationsEntity).then(instance => {
              const newBody = {
                Locations: [{ '@iot.id': instance.id }]
              };
              const id = res.body[CONST.iotId];
              tester.server.patch('/v1.0/Things(' + id + ')').send(newBody)
              .expect('Content-Type', /json/)
              .expect(200)
              .end(() => {
                models.HistoricalLocations.findAndCountAll().then(result => {
                  result.count.should.be.equal(2);
                  done();
                });
              });
            });
          });
        });
      });
    });

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
