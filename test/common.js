import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';

import * as CONST from './constants';
import * as ERR from '../src/errors';

const server       = supertest.agent(app);
const ERRNOS       = ERR.errnos;
const ERRORS       = ERR.errors;

/*
/ Utility method that encapsulates the common tests we are running on each
/ endpoint. Parameters:
/ endpoint: String - Endpoint to test, i.e 'Sensors'
/ mandatory: Array - Mandatory fields we want to check, i.e ['name', 'time']
/ optional: Array - Optional (if any) fields we want to check, i.e ['meta']
/ associations: Array - Associations (if any) of this model, i.e ['Locations']
*/

module.exports = (endpoint, mandatory, optional = [], associations = []) => {
  const testEntity = CONST[endpoint + 'Entity'];
  let patchError, patchSuccess, postError, postSuccess;

  const anotherValue = function anotherValue (property) {
    if (['encodingType', 'feature'].indexOf(property) !== -1) {
      return testEntity[property];
    }

    if (property.indexOf('Time') !== -1) {
      property = 'time';
    }

    return CONST['another' + property] || testEntity[property] + 'changed';
  }

  describe('/' + endpoint + ' API', () => {
    describe('Preconditions', () => {
      beforeEach(done => {
        db().then(models => {
          return Promise.all([
            models[endpoint].destroy({ where: {} })
          ].concat(associations.map(name => {
            return models[name].destroy({ where: {} });
          }))).then(() => done());
        });
      });

      it('/' + endpoint + ' endpoint should exist and be empty', done => {
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

    describe('GET /' + endpoint + '(:id)', () => {
      let instanceId;
      let instanceId2;

      beforeEach(done => {
        let models;
        db().then(_db => {
          models = _db;
          return Promise.all([
            models[endpoint].destroy({ where: {} })
          ].concat(associations.map(name => {
            return models[name].destroy({ where: {} });
          })));
        }).then(() => {
          const property = mandatory[0];
          const relations = {};
          associations.forEach(modelName => {
            relations[modelName] = relations[modelName] || [];
            relations[modelName].push(CONST[modelName + 'Entity']);
          });

          const instance = Object.assign({}, testEntity, relations);
          let anotherInstance = Object.assign({}, testEntity);
          const includes = {
            include: associations.map(association => {
              return models[association];
            })
          };
          anotherInstance[property] = anotherValue(property);
          Promise.all([
            models[endpoint].create(instance, includes),
            models[endpoint].create(anotherInstance)
          ]).then(results => {
            instanceId = results[0].id;
            instanceId2 = results[1].id;
            done();
          });
        });
      });

      it('should respond 200 with a ' + endpoint + ' list if no id provided',
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
              instanceId,
              instanceId2
            ]);
            const selfLink = '/' + endpoint + '(' + instanceId + ')';
            const selfLink2 = '/' + endpoint + '(' + instanceId2 + ')';
            value[CONST.iotSelfLink].should.be.equalOneOf([
              selfLink,
              selfLink2
            ]);

            associations.forEach(name => {
              value[name + CONST.navigationLink].should.be.equalOneOf([
                selfLink + '/' + name,
                selfLink2 + '/' + name
              ]);
            });

            mandatory.concat(optional).forEach((field, index) => {
              let expected = [testEntity[field]];
              if (index === 0) {
                expected.push(anotherValue(field));
                value[field].should.be.equalOneOf(expected);
                return;
              }
              value[field].should.be.deepEqual(expected[0]);
            });
            should.not.exist(value.createdAt);
            should.not.exist(value.updatedAt);
          });
          done();
        });
      });

      it('should respond 200 with a ' + endpoint + ' if id provided', done => {
        const property = mandatory[0];
        let anotherInstance = Object.assign({}, testEntity);
        anotherInstance[property] = anotherValue(property);
        let promises = [];
        [
          Object.assign({}, testEntity, { id: instanceId }),
          Object.assign({}, testEntity, { id: instanceId2 }, anotherInstance)
        ].forEach(instance => {
            promises.push(new Promise(resolve => {
              const path = '/' + endpoint + '(' + instance.id + ')';
              server.get(path)
              .expect('Content-Type', /json/)
              .expect(200)
              .end((err, res) => {
                should.not.exist(err);
                res.status.should.be.equal(200);
                res.body[CONST.iotId].should.be.equal(instance.id);
                res.body[CONST.iotSelfLink].should.be.equal(path);
                associations.forEach(name => {
                  const navLink = name + CONST.navigationLink;
                  res.body[navLink].should.be.equal(path + '/' + name);
                });
                mandatory.concat(optional).forEach(field => {
                  res.body[field].should.be.deepEqual(instance[field]);
                });
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

    describe('POST /' + endpoint, () => {
      const resource = '/' + endpoint;

      postError = (done, body, code) => {
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

      postSuccess = (done, body, expected) => {
        server.post(resource).send(body)
        .expect('Content-Type', /json/)
        .expect(201)
        .end((err, res) => {
          const path = '/' + endpoint + '(' + res.body[CONST.iotId] + ')';
          should.not.exist(err);
          res.status.should.be.equal(201);
          mandatory.concat(optional).forEach(property => {
            res.body[property].should.be.deepEqual(testEntity[property]);
          });
          res.body[CONST.iotId].should.be.instanceOf(Number);
          res.body[CONST.iotSelfLink].should.be.equal(path);
          associations.forEach(name => {
            const navLink = name + CONST.navigationLink;
            res.body[navLink].should.be.equal(path + '/' + name);
          });
          res.header.location.should.be.equal(path);
          db().then(models => {
            Promise.all(associations.map(name => {
              return models[name].findAndCountAll();
            }).concat([
              models[endpoint].findAndCountAll()
            ])).then(results => {
              const primary = results.pop();
              primary.count.should.be.equal(expected[0].count);
              const instance = primary.rows[0];
              instance.id.should.be.equal(res.body[CONST.iotId]);
              mandatory.forEach(property => {
                instance[property].should.be.deepEqual(testEntity[property]);
              });

              results.forEach((association, index) => {
                // XXX associations.rows
                association.count.should.be.equal(expected[index + 1].count);
              });
              done();
            });
          });
        });
      };

      beforeEach(done => {
        db().then(models => {
          return Promise.all([
            models[endpoint].destroy({ where: {} })
          ].concat(associations.map(name => {
            return models[name].destroy({ where: {} });
          }))).then(() => done());
        });
      });

      mandatory.forEach(property => {
        it('should respond 400 if missing ' + property +
           ' property', done => {
          let body = Object.assign({}, testEntity);
          Reflect.deleteProperty(body, property);
          postError(done, body, 400);
        });
      });

      it('should respond 201 if the ' + endpoint + ' is valid', done => {
        let countObject = [];
        countObject.push({ count: 1 });
        associations.forEach(() => {
          countObject.push({ count: 0 });
        });
        const body = Object.assign({}, testEntity);
        postSuccess(done, body, countObject);
      });

      describe('Relations linking', () => {
        associations.forEach(name => {
          xit('should respond 400 if request tries to create a ' +
              endpoint + ' linked to an unexisting ' + name, done => {
            let body = Object.assign({}, testEntity);
            body[name] = {
              '@iot.id': Date.now()
            };
            postError(done, body, 400);
          });

          xit('should respond 201 if request to link ' + endpoint +
              ' to existing ' + name + ' is valid', done => {
            db().then(models => {
              models[name].create(CONST[name + 'Entity']).then(relation => {
                let body = Object.assign({}, testEntity);
                body[name] = {
                  '@iot.id': relation.id
                };
                let countObject = [{ count: 1 }, { count: 0 }];
                postSuccess(done, body, countObject);
              });
            });
          });

          xit('should respond 201 if request to create ' + endpoint +
            ' with related ' + name + ' is valid', done => {
            db().then(models => {
              models[name].create(CONST[name + 'Entity']).then(relation => {
                let body = Object.assign({}, testEntity);
                body[name] = relation;
                postSuccess(done, body, [{ count: 1 }, { count: 0 }]);
              });
            });
          });
        });
      });
    });

    describe('PATCH /' + endpoint + '(:id)', () => {
      let instanceId;
      const resource = () => {
        return '/' + endpoint + '(' + instanceId + ')';
      };

      patchError = (done, body, code, errno, error) => {
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

      patchSuccess = (done, body, expected) => {
        expected = expected || Object.assign({}, body, testEntity);
        server.patch(resource()).send(body)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(200);
          mandatory.concat(optional).forEach(property => {
            res.body[property].should.be.deepEqual(expected[property]);
          });
          res.body[CONST.iotId].should.be.equal(instanceId);
          should.exist(res.body[CONST.iotSelfLink]);
          res.header.location.should.be.equal('/' + endpoint + '(' +
                                              res.body[CONST.iotId] + ')');
          db().then(models => {
            models[endpoint].findAndCountAll().then(result => {
              result.count.should.be.equal(1);
              const value = result.rows[0];
              value.id.should.be.equal(instanceId);
              mandatory.concat(optional).forEach(property => {
                value[property].should.be.deepEqual(expected[property]);
              });
              done();
            });
          });
        });
      };

      beforeEach(done => {
        instanceId = undefined;
        let model;
        db().then(models => {
          model = models[endpoint];
          return Promise.all([
            models[endpoint].destroy({ where: {} })
          ].concat(associations.map(name => {
            return models[name].destroy({ where: {} });
          })));
        }).then(() => {
          const entity = Object.assign({}, testEntity);
          model.create(entity).then(instance => {
            instanceId = instance.id;
            done();
          });
        });
      });

      it('should respond 404 if request tries to update ' +
          'a ' + endpoint + ' that does not exist', done => {
        instanceId = 0;
        const entity = Object.assign({}, testEntity);
        patchError(done, entity, 404, ERR.ERRNO_RESOURCE_NOT_FOUND,
                   ERR.NOT_FOUND);
      });

      it('should respond 200 if request to update a ' +
          'single property of a ' + endpoint + ' is valid', done => {
        const entity = Object.assign({}, testEntity);
        patchSuccess(done, entity);
      });

      it('should respond 200 if request to update all ' +
          'the properties of a ' + endpoint + ' is valid', done => {
        let body = {};
        mandatory.forEach(field => {
          body[field] = anotherValue(field);
        });
        patchSuccess(done, body, Object.assign({}, testEntity, body));
      });

      it('should respond 200 if request to update a ' + endpoint +
         ' tries to update the id', done => {
        const body = Object.assign({}, testEntity, { 'id': 'something' });
        patchSuccess(done, body);
      });

      describe('Relations linking', () => {
        associations.forEach(name => {
          xit('should respond 400 if request tries to update a' + endpoint +
              ' to link it to an unexisting ' + name, done => {
            let body = Object.assign({}, testEntity);
            body[name] = {
              '@iot.id': Date.now()
            };
            patchError(done, body, 400);
          });

          xit('should respond 400 if request includes related ' +
              'entities as inline content', done => {
            let body = Object.assign({}, testEntity);
            body[name] = CONST[name + 'Entity'];
            patchError(done, body, 400);
          });
        })
      })
    });

    describe('DELETE /' + endpoint + '(:id)', () => {
      let instanceId;
      const resource = () => {
        return '/' + endpoint + '(' + instanceId + ')';
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
              models[endpoint].findAndCountAll()
            ]).then(results => {
              results[0].count.should.be.equal(0);
              done();
            });
          });
        });
      };

      beforeEach(done => {
        instanceId = undefined;
        let model;
        db().then(models => {
          model = models[endpoint];
          return Promise.all([
            model.destroy({ where: {} })
          ]);
        }).then(() => {
          const entity = Object.assign({}, testEntity);
          model.create(entity).then(instance => {
            instanceId = instance.id;
            done();
          });
        });
      });

      it('should respond 404 if request tries to delete a ' + endpoint +
          ' that does not exist', done => {
        instanceId = 0;
        deleteError(done);
      });

      it('should respond 204 if request to delete a ' + endpoint + ' is valid',
        done => {
        deleteSuccess(done);
      });
    });
  });

  return {
    postSuccess,
    postError,
    patchSuccess,
    patchError
  }
}
