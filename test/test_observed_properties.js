import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';

import * as CONST from './constants';
import * as ERR   from '../src/errors';

const endpoint  = '/' + CONST.observedProperties;
const server    = supertest.agent(app);

describe('ObservedProperties API', () => {
  describe('Preconditions', () => {
    beforeEach(done => {
      db().then(models => {
        return Promise.all([
          models.ObservedProperties.destroy({ where: {} }),
          models.Datastreams.destroy({ where: {} }),
        ]).then(() => done());
      });
    });

    it('/ObservedProperties endpoint should exist and be empty', done => {
      server.get('/' + CONST.observedProperties)
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

  describe('GET /ObservedProperties(:id)', () => {
    let id;
    let anotherId;

    beforeEach(done => {
      let ObservedProperties;
      db().then(_db => {
        ObservedProperties = _db.ObservedProperties;
        return ObservedProperties.destroy({ where: {} })
      }).then(() => {
        const entity = Object.assign({}, CONST.observedPropertyEntity);
        const anotherEntity = Object.assign({}, CONST.observedPropertyEntity, {
          name: CONST.anotherName
        });
        Promise.all([
          ObservedProperties.create(entity),
          ObservedProperties.create(anotherEntity)
        ]).then(results => {
          id = results[0].id;
          anotherId = results[1].id;
          done();
        });
      });
    });

    it('should respond 200 with a list of observed properties if no id is ' +
       'provided',
       done => {
      server.get(endpoint)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body[CONST.iotCount].should.be.equal(2);
        res.body.value.should.be.instanceof(Array).and.have.lengthOf(2);
        res.body.value.forEach(value => {
          value[CONST.iotId].should.be.equalOneOf([id, anotherId]);
          const selfLink = endpoint + '(' + id + ')';
          const anotherSelfLink = endpoint + '(' + anotherId + ')';
          value[CONST.iotSelfLink].should.be.equalOneOf([selfLink,
                                                         anotherSelfLink]);
          value[CONST.datastreamsNavigationLink].should.be.equalOneOf([
            selfLink + '/' + CONST.datastreams,
            anotherSelfLink + '/' + CONST.datastreams
          ]);
          value.name.should.be.equalOneOf([CONST.name, CONST.anotherName]);
          value.description.should.be.equal(CONST.description);
          value.definition.should.be.equal(CONST.definition);
          should.not.exist(value.createdAt);
          should.not.exist(value.updatedAt);
        });
        done();
      });
    });

    it('should respond 200 with a observed property if id is provided',
       done => {
      let promises = [];
      [{ id, name: CONST.name },
       { id: anotherId, name: CONST.anotherName }].forEach(observedProperty => {
          promises.push(new Promise(resolve => {
            const path = endpoint + '(' + observedProperty.id + ')';
            server.get(path)
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
              should.not.exist(err);
              res.status.should.be.equal(200);
              res.body[CONST.iotId].should.be.equal(observedProperty.id);
              res.body[CONST.iotSelfLink].should.be.equal(path);
              res.body[CONST.datastreamsNavigationLink].should.be.equal(
                path + '/' + CONST.datastreams
              );
              res.body.name.should.be.equal(observedProperty.name);
              res.body.description.should.be.equal(CONST.description);
              res.body.definition.should.be.equal(CONST.definition);
              should.not.exist(res.body.createdAt);
              should.not.exist(res.body.updatedAt);
              resolve();
            });
          }));
        });
        Promise.all(promises).then(() => done());
    });

    it('should respond 404 if invalid id is provided', done => {
      server.get(endpoint + '(0)')
      .expect('Content-Type', /json/)
      .expect(404)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(404);
        res.body.code.should.be.equal(404);
        res.body.errno.should.be.equal(
          ERR.errnos[ERR.ERRNO_RESOURCE_NOT_FOUND]);
        res.body.error.should.be.equal(ERR.errors[ERR.NOT_FOUND]);
        done();
      });
    });
  });

  describe('POST ' + endpoint, () => {
    const postError = (done, body, code) => {
      server.post(endpoint).send(body)
      .expect('Content-Type', /json/)
      .expect(code)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(code);
        res.body.code.should.be.equal(code);
        res.body.errno.should.be.equal(ERR.errnos[ERR.ERRNO_VALIDATION_ERROR]);
        res.body.error.should.be.equal(ERR.errors[ERR.BAD_REQUEST]);
        done();
      });
    };

    const postSuccess = (done, body, expected) => {
      server.post(endpoint).send(body)
      .expect('Content-Type', /json/)
      .expect(201)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(201);
        res.body.name.should.be.equal(CONST.name);
        res.body.description.should.be.equal(CONST.description);
        res.body.definition.should.be.equal(CONST.definition);
        res.body[CONST.iotId].should.be.instanceOf(Number);
        res.body[CONST.iotSelfLink].should.be
           .equal(endpoint + '(' + res.body[CONST.iotId] + ')');
        res.body[CONST.datastreamsNavigationLink].should.be
           .equal(endpoint + '(' + res.body[CONST.iotId] + ')/Datastreams');
        res.header.location.should.be
           .equal(endpoint + '(' + res.body[CONST.iotId] + ')');
        db().then(models => {
          models.ObservedProperties.findAndCountAll().then(result => {
            result.count.should.be.equal(expected.observedProperties.count);
            const observedProperty = result.rows[0];
            observedProperty.id.should.be.equal(res.body[CONST.iotId]);
            observedProperty.name.should.be.equal(CONST.name);
            observedProperty.description.should.be.equal(CONST.description);
            observedProperty.definition.should.be.equal(CONST.definition);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      db().then(models => {
        return models.ObservedProperties.destroy({ where: {} });
      }).then(() => done());
    });

    ['name', 'description', 'definition'].forEach(property => {
      it('should respond 400 if missing ' + property +
         ' property', done => {
        let body = Object.assign({}, CONST.observedPropertyEntity);
        Reflect.deleteProperty(body, property);
        postError(done, body, 400);
      });
    });

    xit('should respond 400 if request tries to create a ' +
        'ObservedProperty linked to an unexisting Datastream', done => {
      const body = Object.assign({}, CONST.observedPropertyEntity, {
        Datastream: {
          '@iot.id': Date.now()
        }
      });
      postError(done, body, 400);
    });

    it('should respond 201 if request to create ObservedProperty is valid',
       done => {
      postSuccess(done, CONST.observedPropertyEntity, {
        observedProperties: {
          count: 1
        }
      });
    });

    xit('should respond 201 if request to link ObservedProperty ' +
        'to existing Datastream is valid', done => {
      db().then(models => {
        models.Datastreams.create(CONST.datastreamEntity).then(datastream => {
          const body = Object.assign({}, CONST.observedPropertyEntity, {
            Datastream: {
              '@iot.id': datastream.id
            }
          });
          postSuccess(done, body, {
            observedProperties: {
              count: 1
            },
            datastreams: {
              count: 0
            }
          });
        });
      });
    });

    xit('should respond 201 if request to create ObservedProperty ' +
        'with related Datastream is valid', done => {
      db().then(models => {
        models.Datastreams.create(CONST.datastreamEntity).then(datastream => {
          const body = Object.assign({}, CONST.observedPropertyEntity, {
            Datastream: datastream
          });
          postSuccess(done, body, {
            observedProperties: {
              count: 1
            },
            datastreams: {
              count: 0
            }
          });
        });
      });
    });
  });

  describe('PATCH /ObservedProperties(:id)', () => {
    let id;
    const resource = () => {
      return endpoint + '(' + id + ')';
    };

    const patchError = (done, body, code, errno, error) => {
      server.patch(resource()).send(body)
      .expect('Content-Type', /json/)
      .expect(code)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(code);
        res.body.code.should.be.equal(code);
        res.body.errno.should.be.equal(ERR.errnos[errno]);
        res.body.error.should.be.equal(ERR.errors[error]);
        done();
      });
    };

    const patchSuccess = (done, body, expected) => {
      expected = expected || Object.assign({}, body,
                                           CONST.observedPropertyEntity);
      server.patch(resource()).send(body)
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.be.equal(200);
        res.body.name.should.be.equal(expected.name);
        res.body.description.should.be.equal(expected.description);
        res.body.definition.should.be.equal(expected.definition);
        res.body[CONST.iotId].should.be.equal(id);
        should.exist(res.body[CONST.iotSelfLink]);
        res.body[CONST.datastreamsNavigationLink].should.be
           .equal(endpoint + '(' + res.body[CONST.iotId] + ')/Datastreams');
        res.header.location.should.be
           .equal(endpoint + '(' + res.body[CONST.iotId] + ')');
        db().then(models => {
          models.ObservedProperties.findAndCountAll().then(result => {
            result.count.should.be.equal(1);
            const observedProperty = result.rows[0];
            observedProperty.id.should.be.equal(id);
            observedProperty.name.should.be.equal(expected.name);
            observedProperty.description.should.be.equal(expected.description);
            observedProperty.definition.should.be.equal(expected.definition);
            done();
          });
        });
      });
    };

    beforeEach(done => {
      id = undefined;
      let ObservedProperties;
      db().then(models => {
        ObservedProperties = models.ObservedProperties;
        return ObservedProperties.destroy({ where: {} });
      }).then(() => {
        ObservedProperties.create(CONST.observedPropertyEntity)
        .then(observedProperty => {
          id = observedProperty.id;
          done();
        });
      });
    });

    xit('should respond 400 if request tries to update ' +
        'a ObservedProperty to link it to an unexisting Datastream', done => {
      const body = Object.assign({}, CONST.observedPropertyEntity, {
        Datastream: {
          '@iot.id': Date.now()
        }
      });
      patchError(done, body, 400);
    });

    xit('should respond 400 if request includes related ' +
        'entities as inline content', done => {
      const body = Object.assign({}, CONST.observedPropertyEntity, {
        Datastream: {
          Datastream: CONST.datastreamEntity
        }
      });
      patchError(done, body, 400);
    });

    it('should respond 404 if request tries to update ' +
        'a ObservedProperty that does not exist', done => {
      id = 0;
      patchError(done, CONST.observedPropertyEntity, 404,
                 ERR.ERRNO_RESOURCE_NOT_FOUND, ERR.NOT_FOUND);
    });

    it('should respond 200 if request to update a ' +
        'single property of a ObservedProperty is valid', done => {
      patchSuccess(done, CONST.observedPropertyEntity);
    });

    it('should respond 200 if request to update all ' +
        'the properties of a ObservedProperty is valid', done => {
      const body = {
        name: 'anotherName'
      };
      patchSuccess(done, body,
                   Object.assign({}, CONST.observedPropertyEntity, body));
    });

    it('should respond 200 if request to update a ' +
        'ObservedProperty tries to update ObservedProperty id', done => {
      const body = Object.assign({}, CONST.observedPropertyEntity, {
        '@iot.id': 'something'
      });
      patchSuccess(done, body);
    });
  });

  describe('DELETE /ObservedProperties(:id)', () => {
    let id;
    const resource = () => {
      return endpoint + '(' + id + ')';
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
        body.errno.should.be.equal(ERR.errnos[ERR.ERRNO_RESOURCE_NOT_FOUND]);
        body.error.should.be.equal(ERR.errors[ERR.NOT_FOUND]);
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
          return models.ObservedProperties.findAndCountAll()
        }).then(result => {
          result.count.should.be.equal(0);
          done();
        });
      });
    };

    beforeEach(done => {
      id = undefined;
      let ObservedProperties;
      db().then(models => {
        ObservedProperties = models.ObservedProperties;
        return ObservedProperties.destroy({ where: {} });
      }).then(() => {
        const entity = Object.assign({}, CONST.observedPropertyEntity);
        ObservedProperties.create(entity).then(observedProperty => {
          id = observedProperty.id;
          done();
        });
      });
    });

    it('should respond 404 if request tries to delete ' +
        'a ObservedProperty that does not exist', done => {
      id = 0;
      deleteError(done);
    });

    it('should respond 204 if request to delete a ObservedProperty is valid',
       done => {
      deleteSuccess(done);
    });
  });

});
