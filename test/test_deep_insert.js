/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

/* global after, before */

'use strict';

import app       from './server';
import db        from '../src/models/db';
import should    from 'should';
import supertest from 'supertest';

import {
  datastreamNavigationLink,
  datastreams,
  datastreamsNavigationLink,
  featureOfInterestNavigationLink,
  iotCount,
  iotId,
  locations,
  locationsNavigationLink,
  observations,
  observationTypes,
  observedProperties,
  observedPropertyNavigationLink,
  sensorNavigationLink,
  sensors,
  thingNavigationLink,
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

const cleanup = models => {
  let promises = [];
  [datastreams,
   locations,
   observations,
   observedProperties,
   sensors,
   things].forEach(model => {
    promises.push(models[model].destroy({ where: {} }));
  });
  return Promise.all(promises);
}

db().then(models => {
  const prepath = '/v1.0/';
  const serverUrl = 'http://127.0.0.1:8001';

  describe('Deep insert', () => {
    describe('Deep insert /Things', () => {
      let thingId;

      before(done => {
        cleanup(models).then(() => {
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
          .end((err, res) => {
            should.not.exist(err);
            thingId = res.body[iotId];
            done();
          });
        });
      });

      after(done => {
        // Make sure that 'deep' deletion also works by deleting
        // the recently inserted Thing. It should delete all associated
        // Datastreams and all associated Observations.
        server.delete(prepath + things + '(' + thingId + ')')
        .expect(200)
        .end(err => {
          should.not.exist(err);
          fetch(prepath + things).then(res => {
            // There should be no Things.
            res.body[iotCount].should.be.equal(0);
            return fetch(prepath + datastreams);
          }).then(res => {
            // There should be no Datastreams.
            res.body[iotCount].should.be.equal(0);
            return fetch(prepath + observations);
          }).then(res => {
            // There should be no Observations.
            res.body[iotCount].should.be.equal(0);
            done();
          });
        });
      });

      it('should create Thing entity and all its associations', done => {
        let datastreamsLink;
        fetch(prepath + things).then(res => {
          res.body[iotCount].should.be.equal(1);
          let locationsLink = res.body.value[0][locationsNavigationLink];
          datastreamsLink = res.body.value[0][datastreamsNavigationLink];
          locationsLink = locationsLink.replace(serverUrl, '');
          datastreamsLink = datastreamsLink.replace(serverUrl, '');
          should.exist(locationsLink);
          should.exist(datastreamsLink);
          return fetch(locationsLink);
        }).then(res => {
          res.body[iotCount].should.be.equal(1);
          return fetch(datastreamsLink);
        }).then(res => {
          res.body[iotCount].should.be.equal(2);
          let promises = [];
          res.body.value.forEach(datastream => {
            let thingLink = datastream[thingNavigationLink];
            let sensorLink = datastream[sensorNavigationLink];
            let observedPropertyLink =
              datastream[observedPropertyNavigationLink];
            thingLink = thingLink.replace(serverUrl, '');
            sensorLink = sensorLink.replace(serverUrl, '');
            observedPropertyLink = observedPropertyLink.replace(serverUrl, '');
            promises.push(fetch(thingLink));
            [thingLink, sensorLink, observedPropertyLink].forEach(url => {
              promises.push(fetch(url));
            });
          });
          return Promise.all(promises);
        }).then(results => {
          results.forEach(result => {
            should.exist(result.body);
          });
          done();
        });
      });
    });

    describe('Deep insert /Observations', () => {
      let observationId;

      before(done => {
        cleanup(models).then(() => {
          const body = {
            'phenomenonTime': '2016-11-18T11:04:15.790Z',
            'resultTime' : '2016-11-18T11:04:15.790Z',
            'result' : 12.4,
            'Datastream': {
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
              },
              'Thing': {
                'description': 'A SensorWeb thing',
                'name':'SensorWebThing',
                'properties': {
                  'organization': 'Mozilla',
                  'owner': 'Mozilla'
                },
                'Locations': [{
                  'description': 'My backyard',
                  'name': 'My backyard',
                  'encodingType': 'application/vnd.geo+json',
                  'location': {
                    'type': 'Point',
                    'coordinates': [-117.123, 54.123]
                  }
                }]
              }
            },
            'FeatureOfInterest': {
              'name': 'Weather Station YYC.',
              'description': 'This is a weather station',
              'encodingType': 'application/vnd.geo+json',
              'feature': {
                'type': 'Point',
                'coordinates': [
                  -114.06,
                  51.05
                ]
              }
            }
          };
          server.post(prepath + observations).send(body)
          .expect('Content-Type', /json/)
          .expect(201)
          .end((err, res) => {
            should.not.exist(err);
            observationId = res.body[iotId];
            done();
          });
        });
      });

      after(done => {
        server.delete(prepath + observations + '(' + observationId + ')')
        .expect(200)
        .end(err => {
          should.not.exist(err);
          fetch(prepath + observations).then(res => {
            // There should be no Observations.
            res.body[iotCount].should.be.equal(0);
            // There are no integrity constrains for Observations, so we
            // are done here.
            done();
          });
        });
      });

      it('should create Observation entity and all its associations', done => {
        let datastreamLink;
        let sensorLink;
        let observedPropertyLink;
        fetch(prepath + observations).then(res => {
          res.body[iotCount].should.be.equal(1);
          let featureOfInterestLink =
            res.body.value[0][featureOfInterestNavigationLink];
          datastreamLink = res.body.value[0][datastreamNavigationLink];
          featureOfInterestLink =
            featureOfInterestLink.replace(serverUrl, '');
          datastreamLink = datastreamLink.replace(serverUrl, '');
          should.exist(featureOfInterestLink);
          should.exist(datastreamLink);
          return fetch(featureOfInterestLink);
        }).then(res => {
          should.exist(res.body);
          return fetch(datastreamLink);
        }).then(res => {
          let thingLink = res.body[thingNavigationLink];
          sensorLink = res.body[sensorNavigationLink];
          observedPropertyLink = res.body[observedPropertyNavigationLink];
          thingLink = thingLink.replace(serverUrl, '');
          sensorLink = sensorLink.replace(serverUrl, '');
          observedPropertyLink = observedPropertyLink.replace(serverUrl, '');
          return fetch(thingLink);
        }).then(res => {
          let locationsLink = res.body[locationsNavigationLink];
          locationsLink = locationsLink.replace(serverUrl, '');
          return fetch(locationsLink);
        }).then(res => {
          should.exist(res.body);
          return fetch(sensorLink);
        }).then(res => {
          should.exist(res.body);
          return fetch(observedPropertyLink);
        }).then(res => {
          should.exist(res.body);
          done();
        });
      });
    });
  });
});
