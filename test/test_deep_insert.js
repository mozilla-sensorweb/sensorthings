/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

/* global before */

'use strict';

import app       from './server';
import db        from '../src/models/db';
import should    from 'should';
import supertest from 'supertest';

import {
  datastreams,
  datastreamsNavigationLink,
  iotCount,
  locations,
  locationsNavigationLink,
  observationTypes,
  observedProperties,
  sensors,
  things
} from './constants';

const server = supertest.agent(app.listen('8001'));

const fetch = url => {
  return new Promise(resolve => {
    server.get(url)
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, res) => {
      should.not.exist(err);
      resolve(res);
    });
  });
};

db().then(models => {
  const prepath = '/v1.0/';
  const serverUrl = 'http://127.0.0.1:8001';
  describe('Deep insert', () => {
    before(done => {
      let promises = [];
      [datastreams,
       locations,
       observedProperties,
       sensors,
       things].forEach(model => {
        promises.push(models[model].destroy({ where: {} }));
      });
      Promise.all(promises).then(() => {
        const body = {
          'name': 'thing 1',
          'description': 'thing 1',
          'properties': {
            'reference': 'first'
          },
          'Locations': [{
            'name': 'location 1',
            'description': 'location 1',
            'location': {
              'type': 'Point',
              'coordinates': [-117.05, 51.05]
            },
            'encodingType': 'application/vnd.geo+json'
          }],
          'Datastreams': [{
            'unitOfMeasurement': {
              'name': 'Lumen',
              'symbol': 'lm',
              'definition': 'Lumen'
            },
            'name': 'datastream 1',
            'description': 'datastream 1',
            'observationType': observationTypes.OM_MEASUREMENT,
            'ObservedProperty': {
              'name': 'Luminous Flux',
              'definition': 'Instances.html/LuminousFlux',
              'description': 'observedProperty 1'
            },
            'Sensor': {
              'name': 'sensor 1',
              'description': 'sensor 1',
              'encodingType': 'application/pdf',
              'metadata': 'Light flux sensor'
            }
          }, {
            'unitOfMeasurement': {
              'name': 'Centigrade',
              'symbol': 'C',
              'definition': 'Centigrade'
            },
            'name': 'datastream 2',
            'description': 'datastream 2',
            'observationType': observationTypes.OM_MEASUREMENT,
            'ObservedProperty': {
              'name': 'Temperature',
              'definition': 'Temperature',
              'description': 'observedProperty 2'
            },
            'Sensor': {
              'name': 'sensor 2',
              'description': 'sensor 2',
              'encodingType': 'application/pdf',
              'metadata': 'Tempreture sensor'
            }
          }]
        };
        server.post(prepath + things).send(body)
        .expect('Content-Type', /json/)
        .expect(201)
        .end(err => {
          should.not.exist(err);
          done();
        });
      });
    });

    it('should create Thing entity and all its associations', done => {
      let datastreamsLink;
      fetch(prepath + things).then(res => {
        res.body[iotCount].should.be.equal(1);
        locationsLink = res.body.value[0][locationsNavigationLink];
        datastreamsLink = res.body.value[0][datastreamsNavigationLink];
        let locationsLink = locationsLink.replace(serverUrl, '');
        datastreamsLink = datastreamsLink.replace(serverUrl, '');
        should.exist(locationsLink);
        should.exist(datastreamsLink);
        return fetch(locationsLink);
      }).then(res => {
        res.body[iotCount].should.be.equal(1);
        return fetch(datastreamsLink);
      }).then(res => {
        res.body[iotCount].should.be.equal(2);
        res.body.value.should.be.instanceof(Array).and.have.lengthOf(2);
        // XXX Issue 93. Allow singular entity names on resource paths
        // Ideally we should use navigationLinks to get sensors and
        // observed properties.
        return models[sensors].findAll();
      }).then(res => {
        res.should.be.instanceof(Array).and.have.lengthOf(2);
        return models[observedProperties].findAll();
      }).then(res => {
        res.should.be.instanceof(Array).and.have.lengthOf(2);
        done();
      });
    });
  });
});
