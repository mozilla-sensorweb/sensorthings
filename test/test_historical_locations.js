import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';

import * as CONST from './constants';
import * as ERR from '../src/errors';

const server       = supertest.agent(app);
const ERRNOS       = ERR.errnos;
const ERRORS       = ERR.errors;
const histLocation = CONST.historicalLocationEntity;
const endpoint     = 'HistoricalLocations';

describe('HistoricalLocations API', () => {
  describe('Preconditions', () => {
    beforeEach(done => {
      db().then(models => {
        return Promise.all([
          models[endpoint].destroy({ where: {} }),
        ]).then(() => done());
      });
    });

    it('/HistoricalLocations endpoint should exist and be empty', done => {
      server.get('/' + endpoint)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body[CONST.iotCount].should.be.equal(0);
        res.body.value.should.be.instanceof(Array).and.have.lengthOf(0);
        done();
      });
    });
  });

  describe('GET /HistoricalLocations(:id)', () => {
    let histoticalLocationId;
    let histoticalLocationId2;

    beforeEach(done => {
      let HistoricalLocations;
      db().then(_db => {
        HistoricalLocations = _db[endpoint];
        return Promise.all([
          HistoricalLocations.destroy({ where: {} })
        ]);
      }).then(() => {
        const entity = Object.assign({}, histLocation);
        const anotherEntity = Object.assign({}, histLocation, {
          time: CONST.anotherTime
        });
        Promise.all([
          HistoricalLocations.create(entity),
          HistoricalLocations.create(anotherEntity)
        ]).then(results => {
          histoticalLocationId = results[0].id;
          histoticalLocationId2 = results[1].id;
          done();
        });
      });
    });

    it('should respond 200 with a HistoricalLocations list if no id provided',
       done => {
      server.get('/' + endpoint)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body[CONST.iotCount].should.be.equal(2);
        res.body.value.should.be.instanceof(Array).and.have.lengthOf(2);
        res.body.value.forEach(value => {
          value[CONST.iotId].should.be.equalOneOf([
            histoticalLocationId,
            histoticalLocationId2
          ]);
          const selfLink = '/' + endpoint + '(' + histoticalLocationId + ')';
          const selfLink2 = '/' + endpoint + '(' + histoticalLocationId2 + ')';
          value[CONST.iotSelfLink].should.be.equalOneOf([selfLink, selfLink2]);
          value.time.should.be.equalOneOf([CONST.time, CONST.anotherTime]);
          should.not.exist(value.createdAt);
          should.not.exist(value.updatedAt);
        });
        done();
      });
    });

    it('should respond 200 with a HistoricalLocation if id provided', done => {
      let promises = [];
      [
        { id: histoticalLocationId, time: CONST.time },
        { id: histoticalLocationId2, time: CONST.anotherTime }
      ].forEach(historicalLocation => {
          promises.push(new Promise(resolve => {
            const path = '/' + endpoint + '(' + historicalLocation.id + ')';
            server.get(path)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              res.status.should.be.equal(200);
              res.body[CONST.iotId].should.be.equal(historicalLocation.id);
              res.body[CONST.iotSelfLink].should.be.equal(path);
              res.body.time.should.be.equal(historicalLocation.time);
              should.not.exist(res.body.createdAt);
              should.not.exist(res.body.updatedAt);
              resolve();
            });
          }));
        });
        Promise.all(promises).then(() => done());
    });

    it('should respond 404 if invalid id is provided', done => {
      server.get('/' + endpoint + '(0)')
      .expect('Content-Type', /json/)
      .expect(404)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(404);
        res.body.code.should.be.equal(404);
        res.body.errno.should.be.equal(ERRNOS[ERR.ERRNO_RESOURCE_NOT_FOUND]);
        res.body.error.should.be.equal(ERRORS[ERR.NOT_FOUND]);
        done();
      });
    });
  });

  describe('POST /HistoricalLocations', () => {
    const resource = '/' + endpoint;

    const postError = (done, body, code) => {
      server.post(resource).send(body)
      .expect('Content-Type', /json/)
      .expect(code)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(code);
        res.body.code.should.be.equal(code);
        res.body.errno.should.be.equal(ERRNOS[ERR.ERRNO_VALIDATION_ERROR]);
        res.body.error.should.be.equal(ERRORS[ERR.BAD_REQUEST]);
        done();
      });
    };

    const postSuccess = (done, body, expected) => {
      server.post(resource).send(body)
      .expect('Content-Type', /json/)
      .expect(201)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(201);
        res.body.time.should.be.equal(CONST.time);
        res.body[CONST.iotId].should.be.instanceOf(Number);
        res.body[CONST.iotSelfLink].should.be
           .equal('/' + endpoint + '(' + res.body[CONST.iotId] + ')');
        res.header.location.should.be
           .equal('/' + endpoint + '(' + res.body[CONST.iotId] + ')');
        db().then(models => {
          models[endpoint].findAndCountAll().then(results => {
            results.count.should.be.equal(expected[endpoint].count);
            const historicalLocation = results.rows[0];
            historicalLocation.id.should.be.equal(res.body[CONST.iotId]);
            historicalLocation.time.should.be.equal(CONST.time);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      db().then(models => {
        Promise.all([
          models[endpoint].destroy({ where: {} })
        ]).then(() => done());
      });
    });

    ['time'].forEach(property => {
      it('should respond 400 if missing ' + property +
         ' property', done => {
        let body = Object.assign({}, histLocation);
        Reflect.deleteProperty(body, property);
        postError(done, body, 400);
      });
    });

    it('should respond 201 if the HistoricalLocation is valid', done => {
      postSuccess(done, histLocation, {
        HistoricalLocations: {
          count: 1
        }
      });
    });
  });

  describe('PATCH /HistoricalLocations(:id)', () => {
    let histoticalLocationId;
    const resource = () => {
      return '/' + endpoint + '(' + histoticalLocationId + ')';
    };

    const patchError = (done, body, code, errno, error) => {
      server.patch(resource()).send(body)
      .expect('Content-Type', /json/)
      .expect(code)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(code);
        res.body.code.should.be.equal(code);
        res.body.errno.should.be.equal(ERRNOS[errno]);
        res.body.error.should.be.equal(ERRORS[error]);
        done();
      });
    };

    const patchSuccess = (done, body, expected) => {
      expected = expected || Object.assign({}, body, histLocation);
      server.patch(resource()).send(body)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body.time.should.be.equal(expected.time);
        res.body[CONST.iotId].should.be.equal(histoticalLocationId);
        should.exist(res.body[CONST.iotSelfLink]);
        res.header.location.should.be.equal('/' + endpoint + '(' +
                                            res.body[CONST.iotId] + ')');
        db().then(models => {
          models.HistoricalLocations.findAndCountAll().then(result => {
            result.count.should.be.equal(1);
            const value = result.rows[0];
            value.id.should.be.equal(histoticalLocationId);
            value.time.should.be.equal(expected.time);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      histoticalLocationId = undefined;
      let HistoricalLocations;
      db().then(models => {
        HistoricalLocations = models.HistoricalLocations;
        return Promise.all([
          HistoricalLocations.destroy({ where: {} })
        ]);
      }).then(() => {
        HistoricalLocations.create(histLocation).then(instance => {
          histoticalLocationId = instance.id;
          done();
        });
      });
    });

    it('should respond 404 if request tries to update ' +
        'a HistoricalLocation that does not exist', done => {
      histoticalLocationId = 0;
      patchError(done, histLocation, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                 ERR.NOT_FOUND);
    });

    it('should respond 200 if request to update a ' +
        'single property of a HistoricalLocation is valid', done => {
      patchSuccess(done, histLocation);
    });

    it('should respond 200 if request to update all ' +
        'the properties of a HistoricalLocation is valid', done => {
      const body = {
        time: CONST.anotherTime
      };
      patchSuccess(done, body, Object.assign({}, histLocation, body));
    });

    it('should respond 200 if request to update a ' +
        'HistoricalLocation tries to update the id', done => {
      const body = Object.assign({}, histLocation, { 'id': 'something' });
      patchSuccess(done, body);
    });
  });

  describe('DELETE /HistoricalLocations(:id)', () => {
    let histoticalLocationId;
    const resource = () => {
      return '/' + endpoint + '(' + histoticalLocationId + ')';
    };

    const deleteError = done => {
      server.delete(resource())
      .expect('Content-Type', /json/)
      .expect(404)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(404);
        const body = res.body;
        body.code.should.be.equal(404);
        body.errno.should.be.equal(ERRNOS[ERR.ERRNO_RESOURCE_NOT_FOUND]);
        body.error.should.be.equal(ERRORS[ERR.NOT_FOUND]);
        done();
      });
    };

    const deleteSuccess = (done) => {
      server.delete(resource())
      .expect(204)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(204);
        db().then(models => {
          Promise.all([
            models.HistoricalLocations.findAndCountAll()
          ]).then(results => {
            results[0].count.should.be.equal(0);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      histoticalLocationId = undefined;
      let HistoricalLocations;
      db().then(models => {
        HistoricalLocations = models.HistoricalLocations;
        return Promise.all([
          HistoricalLocations.destroy({ where: {} })
        ]);
      }).then(() => {
        const entity = Object.assign({}, histLocation);
        HistoricalLocations.create(entity).then(location => {
          histoticalLocationId = location.id;
          done();
        });
      });
    });

    it('should respond 404 if request tries to delete ' +
        'a HistoricalLocation that does not exist', done => {
      histoticalLocationId = 0;
      deleteError(done);
    });

    it('should respond 204 if request to delete a HistoricalLocation is valid',
      done => {
      deleteSuccess(done);
    });
  });

});
