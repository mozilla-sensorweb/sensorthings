import bodyParser   from 'body-parser';
import db           from '../src/models/db';
import express      from 'express';
import should       from 'should';
import { snake }    from 'case';
import supertest    from 'supertest';

import { route }    from '../src/utils';
import { entities } from '../src/constants';

import * as CONST   from './constants';

let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// This middleware takes the tenant values from the query parameter
// and adds them to the request object. Only for testing purposes.
// In practice, something similar will be done by the user of this
// SensorThings module.
app.use('/', (req, res, next) => {
  if (req.query.clientId) {
    req.clientId = req.query.clientId
  }
  if (req.query.userId) {
    req.userId = req.query.userId;
  }
  next();
});

const API_VERSION = 'v1.0';

Object.keys(entities).forEach(endpoint => {
  app.use(route.generate(API_VERSION, endpoint),
          require('../src/routes/' + snake(endpoint))(API_VERSION));
});

const port    = 8082;
const server  = supertest.agent(app.listen(port));
const prepath = '/' + API_VERSION + '/';

const clientIds = [1, 2];

const commonBeforeEach = (entity) => {
  let models;
  // Clear db and store:
  // 1. one entity with clientId=1.
  // 2. one entity with clientId=1 and userId=1.
  // 4. one entity with clientId=2.
  // 5. one entity with clientId=2 and userId=1.
  return db().then(_models => {
    models = _models;
    return _models[entity].destroy({ where: {} })
  }).then(() => {
    let promises = [];
    for (let i = 0; i < clientIds.length; i++) {
      let instance = Object.assign({}, CONST[entity + 'Entity'], {
        clientId: clientIds[i]
      });
      promises.push(models[entity].create(instance).then(result => {
        result.clientId = clientIds[i];
        return Promise.resolve(result);
      }));
      instance.userId = 1;
      promises.push(models[entity].create(instance).then(result => {
        result.clientId = clientIds[i];
        result.userId = 1;
        return Promise.resolve(result);
      }));
    }
    return Promise.all(promises);
  });
};

describe('Multitenancy tests', () => {
  Object.keys(entities).forEach(entity => {
    describe('GET /' + entity, () => {
      beforeEach(done => {
        commonBeforeEach(entity).then(() => {
          done();
        });
      });

      it('GET /' + entity + ' should get all entities', done => {
        const path = prepath + entity;
        server.get(path)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.body.value.should.be.instanceof(Array)
             .and.have.lengthOf(4);
          done();
        });
      });

      [{
        clientId: 1,
        expectedCount: 2
      }, {
        clientId: 1,
        userId: 1,
        expectedCount: 1
      }, {
        clientId: 1,
        userId: 2,
        expectedCount: 0
      }, {
        clientId: 2,
        expectedCount: 2
      }, {
        clientId: 2,
        userId: 1,
        expectedCount: 1
      }, {
        clientId: 2,
        userId: 2,
        expectedCount: 0
      }].forEach(test => {
        let testName = 'GET /' + entity + ' for clientId=' + test.clientId;
        if (test.userId) {
          testName += ' and userId=' + test.userId;
        }
        testName += ' should get ' + test.expectedCount + ' entities';
        it(testName, done => {
          let path = prepath + entity + '?clientId=' + test.clientId;
          if (test.userId) {
            path += '&userId=' + test.userId;
          }
          server.get(path)
          .expect(200)
          .end((err, res) => {
            should.not.exist(err);
            res.body.value.should.be.instanceof(Array)
               .and.have.lengthOf(test.expectedCount);
            done();
          });
        });
      });
    });

    describe('POST /' + entity, () => {
      beforeEach(done => {
        db().then(models => {
          return models[entity].destroy({ where: {} });
        }).then(() => done());
      });

      [{
        clientId: 1
      }, {
        clientId: 1,
        userId: 1
      }, {
        clientId: 2
      }, {
        clientId: 2,
        userId: 1
      }].forEach(test => {
        let testName = 'POST /' + entity;
        if (test.clientId) {
          testName += ' with clientId=' + test.clientId;
        }
        if (test.userId) {
          testName += ' and userId=' + test.userId;
        }

        it(testName + ' should store a entity owned by a ' +
           'specific tenant', done => {
          let path = prepath + entity;
          let postPath = path;
          if (test.clientId) {
            postPath += '?clientId=' + test.clientId;
          }
          if (test.userId) {
            postPath += '&userId=' + test.userId;
          }
          server.post(postPath)
          .expect('Content-Type', /json/)
          .expect(201)
          .send(Object.assign({}, CONST[entity + 'Entity']))
          .end((err, res) => {
            should.not.exist(err);
            let getPath = path + '(' + res.body[CONST.iotId] + ')';
            // Should not get entity with different tenant ids.
            server.get(getPath + '?clientId=3&userId=3')
            .expect(404)
            .end((_err) => {
              should.not.exist(_err);
              // But should get the entity with proper tenant ids.
              if (test.clientId) {
                getPath += '?clientId=' + test.clientId;
              }
              if (test.userId) {
                getPath += '&userId=' + test.userId;
              }
              server.get(getPath)
              .expect(200)
              .end((__err) => {
                should.not.exist(__err);
                done();
              });
            });
          });
        });
      });
    });

    describe('PATCH /' + entity, () => {
      let results;
      beforeEach(done => {
        results = [];
        commonBeforeEach(entity).then(_results => {
          results = _results;
          done();
        });
      });

      [{
        clientId: 1
      }, {
        clientId: 1,
        userId: 1
      }, {
        clientId: 2
      }, {
        clientId: 2,
        userId: 1
      }].forEach((test, index) => {
        let testName = 'PATCH /' + entity;
        if (test.clientId) {
          testName += ' with clientId=' + test.clientId;
        }
        if (test.userId) {
          testName += ' and userId=' + test.userId;
        }
        it(testName + ' should modify a single entity', done => {
          let path = prepath + entity;
          let patchPath = path + '(' + results[index].id + ')';
          if (test.clientId) {
            patchPath += '?clientId=' + test.clientId;
          }
          if (test.userId) {
            patchPath += '&userId=' + test.userId;
          }
          let mod;
          switch (entity) {
            case CONST.datastreams:
            case CONST.featuresOfInterest:
            case CONST.locations:
            case CONST.observedProperties:
            case CONST.sensors:
            case CONST.things:
              mod = { name: 'anothername' };
              break;
            case CONST.observations:
              mod = { result: CONST.anotherresult };
              break;
            case CONST.historicalLocations:
              mod = { time: CONST.anothertime };
              break;
            default:
              throw new Error('oh crap!');
          }
          let body = Object.assign({}, CONST[entity + 'Entity'], mod);
          server.patch(patchPath)
          .expect('Content-Type', /json/)
          .expect(200)
          .send(body)
          .end(() => {
            let modifiedCount = 0;
            Promise.all(results.map(result => {
              return new Promise(resolve => {
                let getPath = path + '(' + result.id + ')';
                server.get(getPath)
                .expect(200)
                .end((err, res) => {
                  should.not.exist(err);
                  switch (entity) {
                    case CONST.datastreams:
                    case CONST.featuresOfInterest:
                    case CONST.locations:
                    case CONST.observedProperties:
                    case CONST.sensors:
                    case CONST.things:
                      if (res.body.name === 'anothername') {
                        modifiedCount++;
                      }
                      break;
                    case CONST.observations:
                      if (res.body.result === CONST.anotherresult) {
                        modifiedCount++;
                      }
                      break;
                    case CONST.historicalLocations:
                      if (res.body.time === CONST.anothertime) {
                        modifiedCount++;
                      }
                      break;
                    default:
                      throw new Error('oh crap!');
                  }
                  resolve();
                });
              });
            })).then(() => {
              modifiedCount.should.be.equal(1);
              done();
            });
          });
        });
      });
    });

    describe('DELETE /' + entity, () => {
      let results;
      beforeEach(done => {
        results = [];
        commonBeforeEach(entity).then(_results => {
          results = _results;
          done();
        });
      });

      it('DELETE /' + entity + ' should respond 404 if request contains ' +
         'wrong clientId', done => {
        let path = prepath + entity;
        let deletePath = path + '(' + results[0].id + ')?clientId=3';
        server.delete(deletePath)
        .expect(404)
        .end(err => {
          should.not.exist(err);
          done();
        });

      });

      [{
        clientId: 1,
        expectedCount: 3
      }, {
        clientId: 1,
        userId: 1,
        expectedCount: 3
      }, {
        clientId: 2,
        expectedCount: 3
      }, {
        clientId: 2,
        userId: 1,
        expectedCount: 3
      }].forEach((test, index) => {
        let testName = 'DELETE /' + entity;
        if (test.clientId) {
          testName += ' for clientId=' + test.clientId;
        }
        if (test.userId) {
          testName += ' and userId=' + test.userId;
        }
        it(testName + ' should delete a single entity', done => {
          let path = prepath + entity;
          let deletePath = path + '(' + results[index].id + ')';
          if (test.clientId) {
            deletePath += '?clientId=' + test.clientId;
          }
          if (test.userId) {
            deletePath += '&userId=' + test.userId;
          }
          server.delete(deletePath)
          .expect(200)
          .end(err => {
            should.not.exist(err);
            server.get(path)
            .expect(200)
            .end((_err, res) => {
              should.not.exist(_err);
              res.body.value.should.be.instanceof(Array)
                 .and.have.lengthOf(test.expectedCount);
              done();
            });
          });
        });
      });
    });
  });
});
