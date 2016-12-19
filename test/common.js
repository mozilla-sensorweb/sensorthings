import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';
import { getModelName } from '../src/utils';

import * as CONST from './constants';
import * as ERR from '../src/errors';

/*
/ Utility method that encapsulates the common tests we are running on each
/ endpoint. Parameters:
/ endpoint: String - Endpoint to test, i.e 'Sensors'
/ mandatory: Array - Mandatory fields we want to check, i.e ['name', 'time']
/ optional: Array - Optional (if any) fields we want to check, i.e ['meta']
*/

module.exports = (endpoint, port, mandatory, optional = []) => {
  const server           = supertest.agent(app.listen(port));
  const ERRNOS           = ERR.errnos;
  const ERRORS           = ERR.errors;
  const prepath          = '/v1.0/';
  const fullPrepath      = 'http://127.0.0.1:' + port + prepath;
  const testEntity       = CONST[endpoint + 'Entity'];

  const anotherValue = function anotherValue(property) {
    if (['encodingType', 'feature'].indexOf(property) !== -1) {
      return testEntity[property];
    }

    if (property.indexOf('Time') !== -1) {
      property = 'time';
    }

    return CONST['another' + property] || testEntity[property] + 'changed';
  }

  const isMultipleAssociation = function isMultipleAssociation(type) {
    const multiples = [CONST.hasMany, CONST.belongsToMany];
    return multiples.indexOf(type) > -1;
  }


  return db().then(models => {
    const associations = models[endpoint].associations;
    let associationsMap = {};

    Object.keys(models[endpoint].associations).forEach(associationName => {
      const pluralName = associations[associationName].options.name.plural;
      const modelName = models[associationName] ? associationName : pluralName;
      associationsMap[modelName] = associationName;
    });

    const removeAssociations = (body) => {
      associatedModels.forEach(model => {
        Reflect.deleteProperty(body, associationsMap[model]);
      });
      return body;
    };

    const getCountObject = (url, body, empty, overrides) => {
      let countObject = {};
      countObject[endpoint] = { count: 1 };

      const alreadyExists = entity => {
        if (!entity) {
          return false;
        }
        return Object.keys(entity).length === 1 && entity[CONST.iotId];
      }

      Object.keys(models[endpoint].associations).forEach(association => {
        const modelName = getModelName(association);
        // We always create one manually on the test
        countObject[modelName] = { count: empty ? 0 : 1 };
        if (body[association]) {
          if (Array.isArray(body[association])) {
            body[association].forEach(a => {
              if (alreadyExists(body[association][a])) {
                return;
              }
              countObject[modelName].count++;
            });
            return;
          }

          if (alreadyExists(body[association])) {
            return;
          }

          countObject[modelName].count++;
        }
      });

      if (overrides) {
        Object.keys(overrides).forEach(name => {
          countObject[name].count = overrides[name](countObject[name].count);
        });
      }

      // HistoricalLocations are automagically created when a Location that is
      // linked to a Thing is created or viceversa.
      const { things, locations, historicalLocations } = CONST;
      if (countObject[historicalLocations] && !body[historicalLocations] &&
          url.indexOf(historicalLocations) === -1) {
        if (endpoint === locations) {
          if (countObject[things].count) {
            countObject[historicalLocations].count = countObject[things].count;
          }
        } else {
          countObject[historicalLocations].count = countObject[locations].count;
        }
      }

      return countObject;
    }

    const associatedModels = Object.keys(associationsMap);
    let patchError, patchSuccess, postError, postSuccess;
    describe('/' + endpoint + ' API', () => {
      describe('Preconditions', () => {
        beforeEach(done => {
          Promise.all([
            models[endpoint].destroy({ where: {} })
          ].concat(associatedModels.map(name => {
            return models[name].destroy({ where: {} });
          }))).then(() => done());
        });

        it('/' + endpoint + ' endpoint should exist and be empty', done => {
          server.get(prepath + endpoint)
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
          Promise.all([
            models[endpoint].destroy({ where: {} })
          ].concat(associatedModels.map(name => {
            return models[name].destroy({ where: {} });
          }))).then(() => {
            const property = mandatory[0];
            const relations = {};
            associatedModels.forEach(modelName => {
              const associationName = associationsMap[modelName];
              const assocEntity = CONST[modelName + 'Entity'];
              relations[associationName] = relations[associationName] || [];
              relations[associationName].push(assocEntity);
            });

            const instance = Object.assign({}, testEntity, relations);
            let anotherInstance = Object.assign({}, testEntity);
            const includes = {
              include: associatedModels.map(association => {
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
          server.get(prepath + endpoint)
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
              const selfLink = fullPrepath + endpoint + '(' + instanceId + ')';
              const selfLink2 =
                fullPrepath + endpoint + '(' + instanceId2 + ')';
              value[CONST.iotSelfLink].should.be.equalOneOf([
                selfLink,
                selfLink2
              ]);

              Object.keys(associations).forEach(name => {
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
              CONST.excludedFields[endpoint].forEach(field => {
                should.not.exist(value[field]);
              });
            });
            done();
          });
        });

        it('should respond 200 with a ' + endpoint + ' if id provided',
           done => {
          const property = mandatory[0];
          let anotherInstance = Object.assign({}, testEntity);
          anotherInstance[property] = anotherValue(property);
          let promises = [];
          [
            Object.assign({}, testEntity, { id: instanceId }),
            Object.assign({}, testEntity, { id: instanceId2 }, anotherInstance)
          ].forEach(instance => {
              promises.push(new Promise(resolve => {
                const path = endpoint + '(' + instance.id + ')';
                server.get(prepath + path)
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                  should.not.exist(err);
                  res.status.should.be.equal(200);
                  res.body[CONST.iotId].should.be.equal(instance.id);
                  res.body[CONST.iotSelfLink].should.be.equal(fullPrepath +
                                                              path);
                  Object.keys(associations).forEach(name => {
                    const navLink = name + CONST.navigationLink;
                    res.body[navLink].should.be.equal(fullPrepath +
                                                      path + '/' + name);
                  });
                  mandatory.concat(optional).forEach(field => {
                    res.body[field].should.be.deepEqual(instance[field]);
                  });
                  CONST.excludedFields[endpoint].forEach(field => {
                    should.not.exist(res.body[field]);
                  });
                  resolve();
                });
              }));
            });
            Promise.all(promises).then(() => done());
        });

        it('should respond 200 to valid associationLink url', done => {
          let promises = [];
          associatedModels.forEach(modelName => {
            const path = endpoint + '(' + instanceId + ')/' +
                         associationsMap[modelName] + '/$ref';
            promises.push(new Promise(resolve => {
              server.get(prepath + path)
              .expect('Content-Type', /json/)
              .expect(200)
              .end((err, res) => {
                should.not.exist(err);
                let value = res.body;
                if (res.body[CONST.iotCount]) {
                  res.body[CONST.iotCount].should.be.equal(1);
                  value = res.body.value[0];
                }
                value[CONST.iotSelfLink].indexOf(
                  fullPrepath + modelName
                ).should.not.be.equal(-1);
                resolve();
              });
            }));
          });
          Promise.all(promises).then(() => done());
        });

        it('should respond 404 if invalid id is provided', done => {
          server.get(prepath + endpoint + '(0)')
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.be.equal(404);
            res.body.code.should.be.equal(404);
            const NOT_FOUND_ERRNO = ERRNOS[ERR.ERRNO_RESOURCE_NOT_FOUND];
            res.body.errno.should.be.equal(NOT_FOUND_ERRNO);
            res.body.error.should.be.equal(ERRORS[ERR.NOT_FOUND]);
            done();
          });
        });

        [false,
         true].forEach(withValue => {
          describe('Get specific properties' +
                   (withValue ? ' with value' : ''), () => {
            it('should respond 404 getting an invalid property', done => {
              let path = prepath + endpoint + '(' + instanceId +
                           ')/randomProperty';
              if (withValue) {
                path += '/$value';
              }
              server.get(path)
              .expect('Content-Type', /json/)
              .expect(404)
              .end((err, res) => {
                should.not.exist(err);
                res.status.should.be.equal(404);
                res.body.code.should.be.equal(404);
                const NOT_FOUND_ERRNO = ERRNOS[ERR.ERRNO_RESOURCE_NOT_FOUND];
                res.body.errno.should.be.equal(NOT_FOUND_ERRNO);
                res.body.error.should.be.equal(ERRORS[ERR.NOT_FOUND]);
                done();
              });
            });

            mandatory.concat(optional).forEach(property => {
              it('should return only 1 field when getting ' + property,
                 done => {
                let path = prepath + endpoint + '(' + instanceId + ')/' +
                             property;
                if (withValue) {
                  path += '/$value';
                }
                server.get(path)
                .expect(200)
                .expect('Content-Type', /json/)
                .end((err, res) => {
                  should.not.exist(err);
                  res.status.should.be.equal(200);
                  if (withValue) {
                    res.body.should.be.deepEqual(testEntity[property]);
                  } else {
                    res.body[property].should.be.deepEqual(
                      testEntity[property]);
                  }
                  done();
                });
              });
            });

            optional.forEach(property => {
              it('should return 204 when getting a empty ' + property, done => {
                let path = prepath + endpoint + '(' + instanceId + ')/' +
                           property;
                let updateProperty = {};
                updateProperty[property] = null;
                models[endpoint].update(updateProperty, {
                  where: { id: instanceId }
                }).then(() => {
                  if (withValue) {
                    path += '/$value';
                  }
                  server.get(path)
                  .expect(204)
                  .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.be.equal(204);
                    res.body.should.be.empty();
                    done();
                  });
                })
              });
            });
          })
        });
      });

      describe('POST /' + endpoint, () => {
        const resource = prepath + endpoint;

        postError = (done, body, code, errno, error, id) => {
          server.post(id ? resource + '(' + id + ')' : resource).send(body)
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

        postSuccess = (done, body, expected, resourceOverride) => {
          server.post(resourceOverride || resource).send(body)
          .expect('Content-Type', /json/)
          .expect(201)
          .end((err, res) => {
            const path = endpoint + '(' + res.body[CONST.iotId] + ')';
            should.not.exist(err);
            res.status.should.be.equal(201);
            mandatory.concat(optional).forEach(property => {
              res.body[property].should.be.deepEqual(testEntity[property]);
            });
            CONST.excludedFields[endpoint].forEach(field => {
              should.not.exist(res.body[field]);
            });
            res.body[CONST.iotId].should.exist;
            res.body[CONST.iotSelfLink].should.be.equal(fullPrepath + path);
            Object.keys(associations).forEach(name => {
              const navLink = name + CONST.navigationLink;
              res.body[navLink].should.be.equal(fullPrepath + path + '/' +
                                                name);
            });
            res.header.location.should.be.equal(fullPrepath + path);
            const expectedModels = Object.keys(expected);
            Promise.all(expectedModels.map(name => {
              return models[name].findAndCountAll().then(result => {
                const resultObject = {};
                resultObject[name] = result;
                return Promise.resolve(resultObject);
              });
            })).then(results => {
              results.forEach(result => {
                if (result[endpoint]) {
                  const instance = result[endpoint].rows[0];
                  instance.id.should.be.equal(res.body[CONST.iotId]);
                  mandatory.forEach(property => {
                    const expectedProperty = testEntity[property];
                    instance[property].should.be.deepEqual(expectedProperty);
                  });
                  return;
                }
                // XXX associations.rows
                const modelName = Object.keys(result)[0];
                const currentExpected = expected[modelName];
                const count = currentExpected ? currentExpected.count : 0;
                result[modelName].count.should.be.equal(count);
              });
              done();
            });
          });
        };

        beforeEach(done => {
          models.sequelize.transaction(transaction => {
            return Promise.all(Object.keys(CONST.entities).map(name => {
              return models[name].destroy({ transaction, where: {} });
            }));
          }).then(() => done());
        });

        mandatory.forEach(property => {
          it('should respond 400 if missing ' + property +
             ' property', done => {
            let body = Object.assign({}, testEntity);
            Reflect.deleteProperty(body, property);
            postError(done, body, 400, ERR.ERRNO_VALIDATION_ERROR,
                      ERR.BAD_REQUEST);
          });
        });

        it('should respond 400 if POST request contains id', done => {
          const body = Object.assign({}, testEntity);
          postError(done, body, 400, ERR.ERRNO_BAD_REQUEST, ERR.BAD_REQUEST,
                    '1');
        });

        it('should respond 201 if the ' + endpoint + ' is valid', done => {
          let body = Object.assign({}, testEntity);
          const countObject = getCountObject(resource, body, true);
          postSuccess(done, body, countObject);
        });

        describe('Relations linking', () => {

          beforeEach(done => {
            // First of all we create an entity NOT associated to the tested
            // model, so we can check that the responses don't include it (by
            // checking the expected entity count on the responses);
            Promise.all(associatedModels.map(name => {
              const assocEntity = Object.assign({}, CONST[name + 'Entity']);
              return models[name].create(assocEntity);
            })).then(() => done());
          });

          associatedModels.forEach(name => {
            it('should respond 400 if request tries to create a ' +
                endpoint + ' linked to an unexisting ' + name, done => {
              let body = Object.assign({}, testEntity);
              body[associationsMap[name]] = {
                '@iot.id': Date.now()
              };
              postError(done, body, 400, ERR.ERRNO_INVALID_ASSOCIATION,
                        ERR.BAD_REQUEST);
            });

            if (associations[associationsMap[name]].mandatory) {
              it('should respond 400 if request tries to create a ' +
                  endpoint + ' missing mandatory ' + name, done => {
                let body = Object.assign({}, testEntity);
                Reflect.deleteProperty(body, associationsMap[name]);
                postError(done, body, 400,
                          ERR.ERRNO_MANDATORY_ASSOCIATION_MISSING,
                          ERR.BAD_REQUEST);
              });
            }

            it('should respond 201 if request to link ' + endpoint +
               ' to existing ' + name + ' is valid', done => {
              models[name].create(CONST[name + 'Entity']).then(relation => {
                let body = Object.assign({}, testEntity);
                body[associationsMap[name]] = {
                  '@iot.id': relation.id
                };
                const overrides = {};
                overrides[name] = () => {
                  return 2;
                }
                const countObject = getCountObject(resource, body, false,
                                                   overrides);
                postSuccess(done, body, countObject);
              });
            });

            it('should respond 201 if request to link ' + endpoint +
               ' to existing ' + name + ' by URL is valid', done => {
              models[name].create(CONST[name + 'Entity'])
              .then(instance => {
                let endpointAssociation = models[name].associations[endpoint] ?
                  endpoint :
                  CONST.entities[endpoint];
                const resourceOverride = prepath + name +
                                         '(' + instance.id + ')/' +
                                         endpointAssociation;
                let body = Object.assign({}, testEntity);
                Reflect.deleteProperty(body, associationsMap[name]);
                const overrides = {};
                overrides[name] = count => {
                  count += 1;
                  return count;
                }
                const countObject = getCountObject(resourceOverride, body,
                                                   false, overrides);
                postSuccess(done, body, countObject, resourceOverride);
              });
            });

            it('should respond 201 if request to create ' + endpoint +
               ' with related ' + name + ' is valid', done => {
              let body = Object.assign({}, testEntity);
              let assocEntity = Object.assign({}, CONST[name + 'Entity']);
              Reflect.deleteProperty(assocEntity, endpoint);
              Reflect.deleteProperty(assocEntity, CONST.entities[endpoint]);
              body[associationsMap[name]] = assocEntity;

              const countObject = getCountObject(resource, body);
              postSuccess(done, body, countObject);
            });

            it('should respond 201 linking an array of ids in a hasMany/' +
               'belongsToMany association', done => {
              const association = associations[associationsMap[name]];
              const type = association.associationType;
              if (!isMultipleAssociation(type)) {
                return done();
              }

              let body = Object.assign({}, testEntity);
              body[associationsMap[name]] = [];
              Promise.all([
                models[name].create(CONST[name + 'Entity']),
                models[name].create(CONST[name + 'Entity'])
              ]).then((created) => {
                created.forEach(row => {
                  body[associationsMap[name]].push({ '@iot.id': row.id });
                });

                const overrides = {};
                overrides[name] = () => {
                  return 3;
                }
                const countObject = getCountObject(resource, body, false,
                                                   overrides);
                postSuccess(done, body, countObject);
              });
            });

            it('should respond 201 linking an array of entities in a hasMany/' +
               'belongsToMany association', done => {
              const association = associations[associationsMap[name]];
              const type = association.associationType;
              if (!isMultipleAssociation(type)) {
                return done();
              }

              let body = Object.assign({}, testEntity);
              let assocEntity = Object.assign({}, CONST[name + 'Entity']);
              Reflect.deleteProperty(assocEntity, endpoint);
              Reflect.deleteProperty(assocEntity, CONST.entities[endpoint]);
              body[associationsMap[name]] = [];
              body[associationsMap[name]].push(assocEntity);
              body[associationsMap[name]].push(assocEntity);
              const countObject = getCountObject(resource, body);

              postSuccess(done, body, countObject);
            });

            it('should respond 400 if one of the ids in a linked array does ' +
               ' not exist', done => {
              const association = associations[associationsMap[name]];
              const type = association.associationType;
              if (!isMultipleAssociation(type)) {
                return done();
              }

              let body = Object.assign({}, testEntity);
              body[associationsMap[name]] = [];
              models[name].create(CONST[name + 'Entity']).then((created) => {
                body[associationsMap[name]] = [
                  { '@iot.id': created.id },
                  { '@iot.id':  Date.now() }
                ];
                postError(done, body, 400, ERR.ERRNO_INVALID_ASSOCIATION,
                          ERR.BAD_REQUEST);
              });
            });

            it('should respond 400 linking an array in a hasOne/belongsTo' +
               ' association', done => {
              const association = associations[associationsMap[name]];
              const type = association.associationType;
              if (isMultipleAssociation(type)) {
                return done();
              }
              let body = Object.assign({}, testEntity);
              body[associationsMap[name]] = [];
              Promise.all([
                models[name].create(CONST[name + 'Entity']),
                models[name].create(CONST[name + 'Entity'])
              ]).then((created) => {
                created.forEach(row => {
                  body[associationsMap[name]].push({ '@iot.id': row.id });
                });
                postError(done, body, 400, ERR.ERRNO_INVALID_ASSOCIATION,
                          ERR.BAD_REQUEST);
              });
            });
          });
        });
      });

      describe('PATCH /' + endpoint + '(:id)', () => {
        let instanceId;
        const resource = () => {
          return prepath + endpoint + '(' + instanceId + ')';
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
          });

          server.put(resource()).send(body)
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

        patchSuccess = (done, body, expected, relations) => {
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
            CONST.excludedFields[endpoint].forEach(field => {
              should.not.exist(res.body[field]);
            });
            res.body[CONST.iotId].should.be.equal(instanceId);
            should.exist(res.body[CONST.iotSelfLink]);
            res.header.location.should.be.equal(fullPrepath + endpoint + '(' +
                                                res.body[CONST.iotId] + ')');
            return models[endpoint].findAndCountAll().then(result => {
              result.count.should.be.equal(1);
              const value = result.rows[0];
              value.id.should.be.equal(instanceId);
              mandatory.concat(optional).forEach(property => {
                value[property].should.be.deepEqual(expected[property]);
              });
              return {
                models,
                entity: value
              }
            }).then(result => {
              if (!relations) {
                return done();
              }
              let promises = [];
              relations.forEach(association => {
                const { type, name, id } = association;
                const entity = result.entity;
                const associationName = name.singular;
                let promise;
                if (isMultipleAssociation(type)) {
                  promise = entity['has' + associationName](id);
                } else {
                  promise = entity['get' + associationName]();
                }
                promises.push(promise);
              });
              Promise.all(promises).then(results => {
                results.forEach(value => {
                  value.should.not.be.equal(null);
                });
                done();
              });
            });
          });
        };

        beforeEach(done => {
          instanceId = undefined;
          let model;
          model = models[endpoint];
          models.sequelize.transaction(transaction => {
            return Promise.all(Object.keys(CONST.entities).map(name => {
              return models[name].destroy({ transaction, where: {} });
            }));
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
          removeAssociations(entity);
          patchSuccess(done, entity);
        });

        it('should respond 200 if request to update all ' +
           'the properties of a ' + endpoint + ' is valid', done => {
          let body = {};
          mandatory.forEach(field => {
            body[field] = anotherValue(field);
          });
          removeAssociations(body);
          patchSuccess(done, body, Object.assign({}, testEntity, body));
        });

        it('should respond 200 if request to update a ' + endpoint +
           ' tries to update the id', done => {
          const body = Object.assign({}, testEntity, { 'id': 'something' });
          removeAssociations(body);
          patchSuccess(done, body);
        });

        describe('Relations linking', () => {
          let testEntities = {};

          beforeEach(done => {
            let promises = [];
            associatedModels.forEach(name => {
              const entity = Object.assign({}, CONST[name + 'Entity']);
              promises.push(models[name].create(entity));
            });
            Promise.all(promises).then(results => {
              results.forEach(result => {
                testEntities[models.getPlural(result.$modelOptions)] =
                  result.id;
              });
              done()
            });
          });

          associatedModels.forEach(name => {
            it('should respond 400 if request tries to update a ' + endpoint +
               ' to link it to an unexisting ' + name, done => {
              let body = Object.assign({}, testEntity);
              removeAssociations(body);
              body[associationsMap[name]] = {
                '@iot.id': '0'
              };
              patchError(done, body, 400, ERR.ERRNO_INVALID_ASSOCIATION,
                         ERR.BAD_REQUEST);
            });

            it('should respond 400 if request includes related ' +
               'entities as inline content', done => {
              let body = Object.assign({}, testEntity);
              removeAssociations(body);
              const assocEntity = Object.assign({}, CONST[name + 'Entity']);
              body[associationsMap[name]] = assocEntity;
              patchError(done, body, 400, ERR.ERRNO_INLINE_CONTENT_NOT_ALLOWED,
                         ERR.BAD_REQUEST);
            });

            it('should respond 200 if request to update a ' + endpoint +
               ' to link it to an existing ' + name + ' is correct', done => {
              const association = associations[associationsMap[name]];
              let body = Object.assign({}, testEntity);
              removeAssociations(body);
              body[associationsMap[name]] = {
                '@iot.id': testEntities[name]
              };
              patchSuccess(done, body, body, [{
                type: association.associationType,
                name: association.target.options.name,
                id: testEntities[name]
              }]);
            });

            it('should respond 200 if request to update a ' + endpoint +
               ' to link it to several existing ' + name + ' is correct',
              done => {
              const association = associations[associationsMap[name]];
              const type = association.associationType;
              if (!isMultipleAssociation(type)) {
                return done();
              }
              let body = Object.assign({}, testEntity);
              removeAssociations(body);
              const anotherEntity = Object.assign({}, CONST[name + 'Entity']);
              models[name].create(anotherEntity).then(result => {
                body[associationsMap[name]] = [{
                  '@iot.id': testEntities[name]
                }, {
                  '@iot.id': result.id
                }];
                patchSuccess(done, body, body, [{
                  type: association.associationType,
                  name: association.target.options.name,
                  id: testEntities[name]
                }, {
                  type: association.associationType,
                  name: association.target.options.name,
                  id: result.id
                }]);
              })
            });

            it('should respond 400 to a request to update a ' + endpoint +
               ' to link it to several existing ' + name, done => {
              const association = associations[associationsMap[name]];
              const type = association.associationType;
              if (isMultipleAssociation(type)) {
                return done();
              }
              let body = Object.assign({}, testEntity);
              removeAssociations(body);
              body[associationsMap[name]] = [{
                '@iot.id': testEntities[name]
              }, {
                '@iot.id': testEntities[name]
              }];
              patchError(done, body, 400, ERR.ERRNO_INVALID_ASSOCIATION,
                         ERR.BAD_REQUEST);
            });
          });
        });
      });

      describe('DELETE /' + endpoint + '(:id)', () => {
        let instanceId;
        const resource = () => {
          return prepath + endpoint + '(' + instanceId + ')';
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
          .expect(200)
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.be.equal(200);
            Promise.all([
              models[endpoint].findAndCountAll()
            ]).then(results => {
              results[0].count.should.be.equal(0);
              done();
            });
          });
        };

        beforeEach(done => {
          instanceId = undefined;
          let model;
          model = models[endpoint];
          Promise.all([
            model.destroy({ where: {} })
          ]).then(() => {
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

        it('should respond 200 if request to delete a ' + endpoint + ' is ' +
           ' valid', done => {
          deleteSuccess(done);
        });

        describe('Integrity constraints', () => {
          const linkedModels = CONST.integrityConstrains[endpoint] || [];
          if (!linkedModels.length) {
            return;
          }

          beforeEach(done => {
            models.sequelize.transaction(transaction => {
              return Promise.all(Object.keys(CONST.entities).map(name => {
                return models[name].destroy({ transaction, where: {} });
              }));
            }).then(() => done());
          });

          it('should delete all ' + linkedModels + ' entities linked to the ' +
             endpoint + ' entity being deleted', done => {
            Promise.all(linkedModels.map(linkedModel => {
              return models[linkedModel].create(
                Object.assign({}, CONST[linkedModel + 'Entity'])
              )
            })).then((instances) => {
              const body = Object.assign({}, body, testEntity);
              linkedModels.forEach((linkedModel, index) => {
                body[associationsMap[linkedModel]] = {
                  '@iot.id': instances[index].id
                };
              });
              return new Promise(resolve => {
                server.post(prepath + endpoint).send(body)
                .expect(201)
                .end((err, res) => {
                  should.not.exist(err);
                  resolve(res.body[CONST.iotId]);
                });
              }).then(id => {
                server.delete(prepath + endpoint + '(' + id + ')').send()
                .expect(200)
                .end((err) => {
                  should.not.exist(err);
                  Promise.all(linkedModels.concat(endpoint).map(modelName => {
                    return models[modelName].findAndCountAll().then(result => {
                      result.count.should.be.equal(0);
                    });
                  })).then(() => done());
                });
              });
            });
          });
        });
      });
    });

    return Promise.resolve({
      postSuccess,
      postError,
      patchSuccess,
      patchError
    });
  });
}
