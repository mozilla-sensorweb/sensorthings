import app           from './server';
import db            from '../src/models/db';
import should        from 'should';
import supertest     from 'supertest';

const server = supertest.agent(app);
const resource = 'Things';

const defaultThingObject = {
  'name': 'name',
  'description': 'camping lantern',
  'properties': {
    'property1': 'it’s waterproof',
    'property2': 'it glows in the dark',
    'property3': 'it repels insects'
  }
};
let responseList = {
  '@iot.count': 1,
  'value': [defaultThingObject]
};
let id = null;

describe('Things API', () => {
  describe('GET Things API', () => {
    beforeEach(done => {
      db().then(models => {
        models[resource].create(defaultThingObject).then(createdThing => {
          id = createdThing.id;
          responseList.value[0]['@iot.id'] = id;
          responseList.value[0]['@iot.selfLink'] =
            '/' + resource + '(' + id + ')';
          done();
        });
      });
    });

    afterEach((done) => {
      db().then(models => {
        models[resource].destroy({
          where: { id: id }
        }).then(() => {
          done();
        });
      });
    });

    it('should return a list of Things', done => {
      server.get('/' + resource)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(200);
          res.body.should.deepEqual(responseList);
          done();
        });
    });

    it('should return an error if the entity does not exist', done => {
      server.get('/' + resource + '(' + (id - 1) + ')')
        .send(defaultThingObject)
        .expect(404)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(404);
          done();
        });
    });

    it('should return an specific Thing item', done => {
      server.get('/' + resource + '(' + id + ')')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(200);
          res.body.should.deepEqual(responseList.value[0]);
          done();
        });
    });
  });

  describe('POST Things API', () => {
    it('should return an error if no name is provided', done => {
      const invalidThing = Object.assign({}, defaultThingObject, {
        name: null
      });
      server.post('/' + resource)
        .send(invalidThing)
        .expect(400)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(400);
          done();
        });
    });

    it('should return an error if no description is provided', done => {
      const invalidThing = Object.assign({}, defaultThingObject, {
        description: null
      });
      server.post('/Things')
        .send(invalidThing)
        .expect(400)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(400);
          done();
        });
    });

    it('should create a new Thing', done => {
      server.post('/Things')
        .send(defaultThingObject)
        .expect(201)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(201);
          res.get('Location').should.match(/Things\(\d*\)$/)
          done();
        });
    });
  });

  describe('PATCH Things API', () => {
    beforeEach(done => {
      db().then(models => {
        models[resource].create(defaultThingObject).then(createdThing => {
          id = createdThing.id;
          done();
        });
      });
    });

    afterEach((done) => {
      db().then(models => {
        models[resource].destroy({
          where: { id: id }
        }).then(() => {
          done();
        });
      });
    });

    it('should return an error if no id is provided', done => {
      server.patch('/' + resource)
        .send()
        .expect(404)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(404);
          done();
        });
    });

    it('should return an error if the entity doesnt exist', done => {
      server.patch('/' + resource + '(' + (id - 1) + ')')
        .send()
        .expect(404)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(404);
          done();
        });
    });

    it('should update a Thing with id', done => {
      const changedThing = Object.assign({}, defaultThingObject, {
        name: 'changed name'
      });
      server.patch('/' + resource + '(' + id + ')')
        .send(changedThing)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(200);
          res.body.name.should.equal(changedThing.name);
          done();
        });
    });

    it('should omit the id if sent in the body', done => {
      const changedThing = Object.assign({}, defaultThingObject, {
        name: 'changed name',
        id: id + 1
      });
      server.patch('/' + resource + '(' + id + ')')
        .send(changedThing)
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(200);
          res.body.name.should.equal(changedThing.name);
          db().then(models => {
            models[resource].findById(id + 1).then(thing => {
              should.not.exist(thing);
              done();
            });
          });
        });
    });
  });

  describe('DELETE Things API', () => {
    beforeEach(done => {
      db().then(models => {
        models[resource].create(defaultThingObject).then(createdThing => {
          id = createdThing.id;
          done();
        });
      });
    });

    it('should return an error if no id is provided', done => {
      server.delete('/' + resource)
        .send()
        .expect(404)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(404);
          done();
        });
    });

    it('should delete a Thing with id', done => {
      server.delete('/' + resource + '(' + id + ')')
        .send()
        .expect(204)
        .end((err, res) => {
          should.not.exist(err);
          res.status.should.be.equal(204);
          res.body.should.be.empty();
          done();
        });
    });
  });
});
