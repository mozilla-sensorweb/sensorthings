/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

/* global run */

'use strict';

import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';

import * as CONST from './constants';
import * as ERR   from '../src/errors';

const ERRORS   = ERR.errors;
const ERRNOS   = ERR.errnos;
const entities = CONST.entities;

const server = supertest.agent(app);

const prepath = '/v1.0/';

const getPlural = plural => {
  return (plural === 'FeaturesOfInterests') ? CONST.featuresOfInterest
                                            : plural;
};

const getError = (done, endpoint, code, errno, error) => {
  server.get(prepath + endpoint)
  .expect('Content-Type', /json/)
  .expect(code)
  .end((err, res) => {
    should.not.exist(err);
    res.status.should.be.equal(code);
    res.body.code.should.be.equal(code);
    res.body.errno.should.be.equal(errno);
    res.body.error.should.be.equal(error);
    done();
  });
}

db().then(models => {
  let noAssociations = {};
  entities.forEach(entity => {
    noAssociations[entity] = [];
    const associations = models[entity].associations;
    entities.forEach(entity_ => {
      if (!associations[entity_] && entity !== entity_) {
        noAssociations[entity].push(entity_);
      }
    });
  });

  describe('Associations', () => {
    describe('Invalid associations', () => {
      entities.forEach(model => {
        noAssociations[model].forEach(anotherModel => {
          const endpoint = model + '(1)/' + anotherModel;
          it('GET ' + endpoint + ' should respond 400 errno 102 ' +
             'INVALID_ASSOCIATION', done => {
            getError(done, endpoint, 400, ERRNOS[ERR.ERRNO_INVALID_ASSOCIATION],
                     ERRORS[ERR.BAD_REQUEST]);
          });
        });
      });
    });

    describe('Valid associations but not found entity', () => {
      entities.forEach(model => {
        Object.keys(models[model].associations).forEach(association => {
          const endpoint = model + '(1)/' + association;
          // XXX Issues #18, #22 and #23.
          const notImplemented = [
            'Datastreams',
            'HistoricalLocations',
            'Observations'
          ];
          const test = (
            notImplemented.indexOf(model) === -1 &&
            notImplemented.indexOf(association) === -1
          ) ? it : xit;
          test('GET ' + endpoint + ' should respond 404 errno 404 ' +
             'RESOURCE_NOT_FOUND', done => {
            getError(done, endpoint, 404, ERRNOS[ERR.ERRNO_RESOURCE_NOT_FOUND],
                     ERRORS[ERR.NOT_FOUND]);
          });
        });
      });
    });

    let describePromises = [];
    entities.forEach(modelName => {
      describePromises.push(new Promise(resolve => {
         // XXX Issues #18, #22 and #23.
        if ([
          'Datastreams',
          'HistoricalLocations',
          'Observations'
        ].indexOf(modelName) !== -1) {
          return resolve();
        }

        const testEntity = CONST[modelName + 'Entity'];
        const model = models[modelName];
        const endpoints = [];

        let promises = [];
        promises.push(model.destroy({ where: {} }));
        Object.keys(model.associations).forEach(associationName => {
          const association = model.associations[associationName];
          promises.push(models[association.as].destroy({ where: { } }));
        });
        Promise.all(promises).then(() => {
          promises = [];
          promises.push(model.create(testEntity));
          Object.keys(model.associations).forEach(associationName => {
            const association = model.associations[associationName];
            const otherModel = association.as;
            const otherEntity = CONST[otherModel + 'Entity'];
            promises.push(models[otherModel].create(otherEntity));
          });
          return Promise.all(promises);
        }).then(results => {
          let plural = getPlural(results[0].$modelOptions.name.plural);
          let url = plural + '(' + results[0].id + ')/';
          for (let i = 1; i < results.length; i++) {
            const name = getPlural(results[i].$modelOptions.name.plural);
            endpoints.push(url + name + '(' + results[i].id + ')');
          }

          endpoints.forEach(endpoint => {
            describe('Models association is valid and entities exist but ' +
                     'they are not associated', () => {
              it('GET ' + endpoint + ' should respond 404 NOT_FOUND', done => {
                getError(done, endpoint, 404,
                         ERRNOS[ERR.ERRNO_RESOURCE_NOT_FOUND],
                         ERRORS[ERR.NOT_FOUND]);
              });
            });
          });

          resolve();
        });
      }));
    });

    // Using --delay and run() allows us to build a suite that is the result of
    // an asynchronous computation like getting the models from the db.
    Promise.all(describePromises).then(run);
  });
});
