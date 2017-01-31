import db           from '../src/models/db';
import commonTests  from './common';
import * as CONST   from './constants';
import should       from 'should';
import {
  BAD_REQUEST,
  ERRNO_VALIDATION_ERROR
} from '../src/errors';

const mandatory     = ['name', 'description', 'encodingType', 'location'];

commonTests(CONST.locations, 8884, mandatory).then(tester => {
  describe('Locations API - specific', () => {

    beforeEach(done => {
      db().then(models => {
        models.sequelize.transaction(transaction => {
          return Promise.all(Object.keys(CONST.entities).map(name => {
            return models[name].destroy({ transaction, where: {} });
          }));
        }).then(() => done());
      });
    });

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

    describe('Check multilevel associations', () => {
      let datastreamId, thingId;
      beforeEach(done => {
        let datastreamEntity = Object.assign({}, CONST.DatastreamsEntity);
        const locationEntity = Object.assign({}, CONST.LocationsEntity);
        datastreamEntity.Thing.Locations = [locationEntity];
        const url = '/v1.0/Datastreams';
        tester.server.post(url).send(datastreamEntity)
        .expect(201)
        .end((err, res) => {
          should.not.exist(err);
          datastreamId = res.body[CONST.iotId];
          tester.server.get(url + '(' + datastreamId + ')/Thing').send()
          .expect(200)
          .end((err2, res2) => {
            should.not.exist(err2);
            thingId = res2.body[CONST.iotId];
            done();
          });
        });
      });

      it('should get Locations using the Thing path', done => {
        tester.server.get('/v1.0/Things(' + thingId + ')/Locations').send()
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body[CONST.iotCount].should.be.equal(1);
          res.body.value.should.be.instanceof(Array);
          res.body.value.length.should.be.equal(1);
          done();
        });
      });

      it('should get Locations using the Datastreams path', done => {
        const url = '/v1.0/Datastreams(' + datastreamId + ')/Thing';
        tester.server.get(url + '/Locations').send()
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body[CONST.iotCount].should.be.equal(1);
          res.body.value.should.be.instanceof(Array);
          res.body.value.length.should.be.equal(1);
          done();
        });
      });
    });
  });
});
