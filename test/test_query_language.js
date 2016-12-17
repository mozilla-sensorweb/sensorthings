/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global before */

'use strict';

import app        from './server';
import db         from '../src/models/db';
import should     from 'should';
import supertest  from 'supertest';

import * as CONST from './constants';
import * as ERR   from '../src/errors';

db().then(models => {
  describe('Query language', () => {
    const port        = 8123;
    const server      = supertest.agent(app.listen(port));
    const limit       = CONST.limit;
    const prepath     = '/v1.0/';
    const fullPrepath = 'http://127.0.0.1:' + port + prepath;
    const modelName   = 'Things';

    const get = endpoint => {
      return new Promise(resolve => {
        server.get(prepath + endpoint)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          resolve(res.body);
        });
      });
    };

    const getError = (endpoint, error) => {
      return new Promise(resolve => {
        server.get(prepath + endpoint)
        .expect('Content-Type', /json/)
        .expect(error.code)
        .end((err, res) => {
          should.not.exist(err);
          should.not.exist(res.body[CONST.nextLink]);
          res.body.should.be.deepEqual(error);
          resolve();
        });
      });
    };

    const insert = (count, done) => {
      const model = models[modelName];
      const entity = Object.assign({}, CONST[modelName + 'Entity']);
      let promises = [];
      model.destroy({ where: {} }).then(() => {
        for (let i = 0; i < count; i++) {
          promises.push(model.create(entity));
        }
        Promise.all(promises).then(() => {
          done()
        });
      });
    };

    describe('$top and $skip', () => {
      const topSkipLimit = 302;

      before(done => {
        insert(topSkipLimit, done);
      });

      [{
        top: undefined,
        expected: limit,
        nextLink: {
          top: limit,
          skip: limit
        }
      }, {
        top: 50,
        expected: 50,
        nextLink: {
          top: 50,
          skip: 50
        }
      }, {
        top: 101,
        expected: limit,
        nextLink: {
          top: limit,
          skip: limit
        }
      }].forEach(test => {
        const query = test.top ? '?$top=' + test.top : '';
        it('GET ' + modelName + query +
           ' should respond with ' + test.expected + ' entities',
           done => {
          get(modelName + query)
          .then(result => {
            result[CONST.iotCount].should.be.equal(topSkipLimit);
            result.value.should.be.instanceof(Array).and.have.lengthOf(
              test.expected);
            const nextLink = fullPrepath + modelName +
                             '?$top=' + test.nextLink.top +
                             '&$skip=' + test.nextLink.skip;
            result[CONST.iotNextLink].should.be.equal(nextLink);
            done();
          });
        });
      });

      it('GET ' + modelName + '?$top=-1 should respond with 400 BAD_REQUEST',
         done => {
        getError(modelName + '?$top=-1', {
          code: 400,
          errno: ERR.errnos[ERR.ERRNO_INVALID_QUERY_STRING],
          error: ERR.errors[ERR.BAD_REQUEST],
          message: '$top'
        }).then(() => {
          done()
        });
      });
    });

    describe('$count', () => {
      const count = 10;

      before(done => {
        insert(count, done);
      });

      it('should respond with count', done => {
        get(modelName + '?$count=true')
        .then(result => {
          result[CONST.iotCount].should.be.equal(count);
          done();
        });
      });

      // XXX OData parser. $count is not supported.
      xit('should respond without count', done => {
        get(modelName + '?$count=false')
        .then(result => {
          should.not.exist(result[CONST.iotCount]);
          done();
        });
      });
    });

    describe('$orderby', () => {
      describe('Only 1 field', () => {
        const count = 9;

        before(done => {
          const model = models[modelName];
          const entity = Object.assign({}, CONST[modelName + 'Entity']);
          let promises = [];
          model.destroy({ where: {} }).then(() => {
            for (let i = 0; i < count; i++) {
              entity.name = i;
              promises.push(model.create(entity));
            }
            Promise.all(promises).then(() => {
              done()
            });
          });
        });

        it('should respond with an ascending order', done => {
          get(modelName + '?$orderby=name')
          .then(result => {
            result[CONST.iotCount].should.be.equal(count);
            // Checking that they are in order
            for (let i = 0; i < count; i++) {
              result.value[i].name.should.be.equal(String(i));
            }
            done();
          });
        });

        it('should respond with a descending order', done => {
          get(modelName + '?$orderby=name desc')
          .then(result => {
            result[CONST.iotCount].should.be.equal(count);
            // Checking that they are in order
            let index = 0;
            for (let i = count - 1; i > -1; i--) {
              result.value[index].name.should.be.equal(String(i));
              index++;
            }
            done();
          });
        });
      });

      describe('More than 1 field', () => {
        const count = 9;

        before(done => {
          const model = models[modelName];
          const entity = Object.assign({}, CONST[modelName + 'Entity']);

          let promises = [];
          model.destroy({ where: {} }).then(() => {
            for (let i = 0; i < count; i++) {
              entity.name = i < 5 ? '1' : '2';
              entity.description = (count - i);
              promises.push(model.create(entity));
            }
            Promise.all(promises).then(() => {
              done();
            });
          });
        });

        it('should order by name and then by description', done => {
          get(modelName + '?$orderby=name, description')
          .then(result => {
            result[CONST.iotCount].should.be.equal(count);
            // Checking that they are in order
            for (let i = 0; i < count; i++) {
              result.value[i].name.should.be.equal(i < 5 ? '1' : '2');
              const desc = i < 5 ? 5 + i : i - 4;
              result.value[i].description.should.be.equal(String(desc));
            }
            done();
          });
        });

        it('should order by name and then descending by description', done => {
          get(modelName + '?$orderby=name, description desc')
          .then(result => {
            result[CONST.iotCount].should.be.equal(count);
            // Checking that they are in order
            for (let i = 0; i < count; i++) {
              result.value[i].name.should.be.equal(i < 5 ? '1' : '2');
              const desc = count - i;
              result.value[i].description.should.be.equal(String(desc));
            }
            done();
          });
        });
      });
    });

    describe('$select', () => {
      let ids = [];
      const entity = Object.assign({}, CONST[modelName + 'Entity']);
      before(done => {
        const model = models[modelName];
        let promises = [];
        model.destroy({ where: {} }).then(() => {
          for (let i = 0; i < 2; i++) {
            promises.push(model.create(entity));
          }
          Promise.all(promises).then(results => {
            results.forEach(result => {
              ids.push(result.id);
            });
            done();
          });
        });
      });

      it('should select the entire entity if no $select is present', done => {
        const url = modelName + '(' + ids[0] + ')';
        get(url).then(result => {
          const selfLink = fullPrepath + modelName + '(' + ids[0] + ')';
          const expected = Object.assign({}, entity, {
            '@iot.selfLink': selfLink,
            '@iot.id': ids[0],
            'Locations@iot.navigationLink': selfLink + '/Locations',
            'HistoricalLocations@iot.navigationLink': selfLink +
                                                      '/HistoricalLocations',
            'Datastreams@iot.navigationLink': selfLink + '/Datastreams',
          });
          result.should.be.deepEqual(expected);
          done();
        });
      });

      it('should select selfLink and id for Thing with id', done => {
        const url = modelName + '(' + ids[0] +
          ')?$select=selfLink,id';
        get(url).then(result => {
          result.should.be.deepEqual({
            '@iot.selfLink': fullPrepath + modelName + '(' + ids[0] + ')',
            '@iot.id': ids[0]
          });
          done();
        });
      });

      it('should select Locations for Thing with id', done => {
        const url = modelName + '(' + ids[0] + ')?$select=Locations';
        get(url).then(result => {
          result.should.be.deepEqual({
            'Locations@iot.navigationLink': fullPrepath + modelName + '(' +
                                            ids[0] + ')/Locations'
          });
          done();
        });
      });

      it('should select description and name for Thing with id', done => {
        const url = modelName + '(' + ids[0] + ')?$select=description,name';
        get(url).then(result => {
          result.should.be.deepEqual({
            description: entity.description,
            name: entity.name
          });
          done();
        });
      });

      it('should select description and name for all Things', done => {
        const url = modelName + '?$select=description,name';
        get(url).then(result => {
          result.should.be.deepEqual({
            '@iot.count': 2,
            value: [{
              description: entity.description,
              name: entity.name
            }, {
              description: entity.description,
              name: entity.name
            }]
          });
          done();
        });
      });
    });
  });
});
