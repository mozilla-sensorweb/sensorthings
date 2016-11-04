import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';

import * as CONST from './constants';
import * as ERR from '../src/errors';

const server = supertest.agent(app);
const GEO_JSON = CONST.encodingTypes.GEO_JSON;
const ERRNOS = ERR.errnos;
const ERRORS = ERR.errors;

describe('Locations API', () => {
  describe('Preconditions', () => {
    beforeEach(done => {
      db().then(models => {
        return Promise.all([
          models.Locations.destroy({ where: {} }),
        ]).then(() => done());
      });
    });

    it('/Locations endpoint should exist and be empty', done => {
      server.get('/Locations')
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

  describe('GET /Locations(:id)', () => {
    let locationId;
    let locationId2;

    beforeEach(done => {
      let Locations;
      db().then(_db => {
        Locations = _db.Locations;
        return Promise.all([
          Locations.destroy({ where: {} })
        ]);
      }).then(() => {
        const entity = Object.assign({}, CONST.locationEntity);
        const anotherEntity = Object.assign({}, CONST.locationEntity, {
          name: CONST.anotherName
        });
        Promise.all([
          Locations.create(entity),
          Locations.create(anotherEntity)
        ]).then(results => {
          locationId = results[0].id;
          locationId2 = results[1].id;
          done();
        });
      });
    });

    it('should respond 200 with a list of Locations if no id is provided',
       done => {
      server.get('/Locations')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body[CONST.iotCount].should.be.equal(2);
        res.body.value.should.be.instanceof(Array).and.have.lengthOf(2);
        res.body.value.forEach(value => {
          value[CONST.iotId].should.be.equalOneOf([locationId, locationId2]);
          const selfLink = '/Locations(' + locationId + ')';
          const anotherSelfLink = '/Locations(' + locationId2 + ')';
          value[CONST.iotSelfLink].should.be.equalOneOf([selfLink,
                                                     anotherSelfLink]);
          value.name.should.be.equalOneOf([CONST.name, CONST.anotherName]);
          value.description.should.be.equal(CONST.description);
          value.encodingType.should.be.equal(GEO_JSON);
          value.location.should.deepEqual(CONST.point);
          should.not.exist(value.createdAt);
          should.not.exist(value.updatedAt);
        });
        done();
      });
    });

    it('should respond 200 with a location if id is provided', done => {
      let promises = [];
      [{ id: locationId, name: CONST.name },
       { id: locationId2, name: CONST.anotherName }].forEach(location => {
          promises.push(new Promise(resolve => {
            const path = '/Locations(' + location.id + ')';
            server.get(path)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              res.status.should.be.equal(200);
              res.body[CONST.iotId].should.be.equal(location.id);
              res.body[CONST.iotSelfLink].should.be.equal(path);
              res.body.name.should.be.equal(location.name);
              res.body.description.should.be.equal(CONST.description);
              res.body.encodingType.should.be.equal(GEO_JSON);
              res.body.location.should.deepEqual(CONST.point);
              should.not.exist(res.body.createdAt);
              should.not.exist(res.body.updatedAt);
              resolve();
            });
          }));
        });
        Promise.all(promises).then(() => done());
    });

    it('should respond 404 if invalid id is provided', done => {
      server.get('/Locations(0)')
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

  describe('POST /Locations', () => {
    const resource = '/Locations';

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
        res.body.name.should.be.equal(CONST.name);
        res.body.description.should.be.equal(CONST.description);
        res.body.encodingType.should.be.equal(GEO_JSON);
        res.body.location.should.deepEqual(CONST.point);
        res.body[CONST.iotId].should.be.instanceOf(Number);
        res.body[CONST.iotSelfLink].should.be
           .equal('/Locations(' + res.body[CONST.iotId] + ')');
        res.header.location.should.be
           .equal('/Locations(' + res.body[CONST.iotId] + ')');
        db().then(models => {
          Promise.all([
            models.Locations.findAndCountAll()
          ]).then(results => {
            const Locations = results[0];
            Locations.count.should.be.equal(expected.Locations.count);
            const location = Locations.rows[0];
            location.id.should.be.equal(res.body[CONST.iotId]);
            location.name.should.be.equal(CONST.name);
            location.description.should.be.equal(CONST.description);
            location.encodingType.should.be.equal(GEO_JSON);
            location.location.should.deepEqual(CONST.point);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      db().then(models => {
        Promise.all([
          models.Locations.destroy({ where: {} })
        ]).then(() => done());
      });
    });

    ['name', 'description', 'encodingType', 'location'].forEach(property => {
      it('should respond 400 if missing ' + property +
         ' property', done => {
        let body = Object.assign({}, CONST.locationEntity);
        Reflect.deleteProperty(body, property);
        postError(done, body, 400);
      });
    });

    [CONST.encodingTypes.UNKNOWN,
     CONST.encodingTypes.PDF,
     CONST.encodingTypes.TEXT_HTML,
     CONST.encodingTypes.LOCATION_TYPE].forEach(type => {
      it('should respond 400 if encodingType is ' + type,
        done => {
        const body = Object.assign({}, CONST.locationEntity, {
          encodingType: type,
        });
        postError(done, body, 400);
      });
    });

    it('should respond 201 if request to create Location is valid', done => {
      postSuccess(done, CONST.locationEntity, {
        Locations: {
          count: 1
        }
      });
    });
  });

  describe('PATCH /Locations(:id)', () => {
    let locationId;
    const resource = () => {
      return '/Locations(' + locationId + ')';
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
      expected = expected || Object.assign({}, body, CONST.locationEntity);
      server.patch(resource()).send(body)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body.name.should.be.equal(expected.name);
        res.body.description.should.be.equal(expected.description);
        res.body.encodingType.should.be.equal(expected.encodingType);
        res.body.location.should.deepEqual(CONST.point);
        res.body[CONST.iotId].should.be.equal(locationId);
        should.exist(res.body[CONST.iotSelfLink]);
        res.header.location.should.be
           .equal('/Locations(' + res.body[CONST.iotId] + ')');
        db().then(models => {
          models.Locations.findAndCountAll().then(result => {
            result.count.should.be.equal(1);
            const value = result.rows[0];
            value.id.should.be.equal(locationId);
            value.name.should.be.equal(expected.name);
            value.description.should.be.equal(expected.description);
            value.encodingType.should.be.equal(expected.encodingType);
            value.location.should.deepEqual(CONST.point);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      locationId = undefined;
      let Locations;
      db().then(models => {
        Locations = models.Locations;
        return Promise.all([
          Locations.destroy({ where: {} })
        ]);
      }).then(() => {
        Locations.create(CONST.locationEntity).then(location => {
          locationId = location.id;
          done();
        });
      });
    });

    [CONST.encodingTypes.UNKNOWN,
     CONST.encodingTypes.PDF,
     CONST.encodingTypes.TEXT_HTML,
     CONST.encodingTypes.LOCATION_TYPE].forEach(type => {
      it('should respond 400 if encodingType is ' + type, done => {
        const body = Object.assign({}, CONST.locationEntity, {
          encodingType: type,
        });
        patchError(done, body, 400, ERR.ERRNO_VALIDATION_ERROR,
                  ERR.BAD_REQUEST);
      });
    });

    it('should respond 404 if request tries to update ' +
        'a Location that does not exist', done => {
      locationId = 0;
      patchError(done, CONST.locationEntity, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                 ERR.NOT_FOUND);
    });

    it('should respond 200 if request to update a ' +
        'single property of a Location is valid', done => {
      patchSuccess(done, CONST.locationEntity);
    });

    it('should respond 200 if request to update all ' +
        'the properties of a Location is valid', done => {
      const body = {
        name: 'anotherName'
      };
      patchSuccess(done, body, Object.assign({}, CONST.locationEntity, body));
    });

    it('should respond 200 if request to update a ' +
        'Location tries to update Location id', done => {
      const body = Object.assign({}, CONST.locationEntity, {
        '@iot.id': 'something'
      });
      patchSuccess(done, body);
    });
  });

  describe('DELETE /Locations(:id)', () => {
    let locationId;
    const resource = () => {
      return '/Locations(' + locationId + ')';
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
            models.Locations.findAndCountAll()
          ]).then(results => {
            results[0].count.should.be.equal(0);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      locationId = undefined;
      let Locations;
      db().then(models => {
        Locations = models.Locations;
        return Promise.all([
          Locations.destroy({ where: {} })
        ]);
      }).then(() => {
        const entity = Object.assign({}, CONST.locationEntity);
        Locations.create(entity).then(location => {
          locationId = location.id;
          done();
        });
      });
    });

    it('should respond 404 if request tries to delete ' +
        'a Location that does not exist', done => {
      locationId = 0;
      deleteError(done);
    });

    it('should respond 204 if request to delete a Location is valid', done => {
      deleteSuccess(done);
    });
  });

});
