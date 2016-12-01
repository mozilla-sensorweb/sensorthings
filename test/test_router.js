import bodyParser   from 'body-parser';
import express      from 'express';
import should       from 'should';
import supertest    from 'supertest';
import queryParser  from '../src/middlewares/query_parser'
import { route }    from '../src/utils';
import { entities } from '../src/constants';


let app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const API_VERSION = 'v1.0';

app.use('/', queryParser);

Object.keys(entities).forEach(entityName => {
  app.use(route.generate(API_VERSION, entityName), (req, res) => {
    res.status(200).json({ router: entityName });
  });
});

const VALID_URLS = [
  'Sensors',
  'Things(1)',
  'Things(1)/Sensors',
  'Things(1)/Locations/$ref',
  'Datastreams(2)/Thing/$ref',
  'Datastreams(3)/Thing/name',
  'Things(1)/prop/$value',
  'Things(1)?$expand=Sensors',
  'Things?$expand=Datastreams/ObservedProperty',
  'Datastreams(1)?$expand=Observations,ObservedProperty',
  'Observations?$select=result,resultTime',
  'Datastreams(1)?$select=id,Observations&$expand=Observations/Datastream',
  'Observations?$orderby=result',
  'Observations?$expand=Datastream&$orderby=Datastreams/id desc',
  'Sensors?$orderby=Datastreams/id desc, name asc',
  'Things?$top=5',
  'Observations?$top=5&$orderby=phenomenonTime%20desc',
  'Things?$skip=5',
  'Things?$count=true',
  'Observations?$filter=result lt 10.00',
  'Observations?$filter=Datastream/id eq \'1\'',
  'Things?$expand=Datastreams/Observations/FeatureOfInterest&$filter=' +
  'Datastreams/Observations/FeatureOfInterest/id eq \'FOI_1\''
];

const INVALID_URLS = [
  'Things(1)/Sensors/$value',
  'Things/Sensors',
  '/(1)/Things',
  '/Sensors(1/Things',
  '/NotAValidEndpoint(1)/Things',
  '/Things/(1)',
  '///Things'
];

const INVALID_QUERY_STRING = [
  'Things?$expanding=Datastreams',
  'Things?$top=test',
  'Things?$oasdaasdkl=test',
  'Observations?$select=result,ResultTime',
];

const port             = 8080;
const server           = supertest.agent(app.listen(port));
const prepath          = '/' + API_VERSION + '/';

describe('Router test', () => {
  describe('valid urls', () => {
    VALID_URLS.forEach(url => {
      it(url + ' should return 200', done => {
        server.get(prepath + url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(200);
          done();
        });
      });
    });
  });

  describe('invalid urls', () => {
    INVALID_URLS.forEach(url => {
      it(url + ' should return 404', done => {
        server.get(prepath + url)
        .expect(404)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(404);
          done();
        });
      });
    });
  });

  describe('invalid query string', () => {
    INVALID_QUERY_STRING.forEach(url => {
      it(url + ' should return 400', done => {
        server.get(prepath + url)
        .expect('Content-Type', /json/)
        .expect(400)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(400);
          res.body.errno.should.be.equal(104);
          done();
        });
      });
    });
  });

  describe('endpoint urls', () => {
    const preRoute = 'Observations(1)/';
    Object.keys(entities).forEach(entityName => {
      it('should access to the property of a singular association', done => {
        const url = preRoute + entities[entityName] + '/name';
        server.get(prepath + url)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(200);
          res.body.router.should.be.equal(entityName);
          done();
        });
      });
    });
  });
});

