import db         from '../src/models/db';
import * as CONST from './constants';
import { hookInvoked, resetHooks } from './server';

// Database hooks (sequelize)
const dbHooks = [
  'beforeCreate',
  'afterCreate',
  'beforeDestroy',
  'afterDestroy',
  'beforeUpdate',
  'afterUpdate'
];

db().then(models => {
  describe('Database hooks', () => {
    beforeEach(() => {
      resetHooks();
      return models.sequelize.transaction(transaction => {
        return Promise.all(Object.keys(CONST.entities).map(name => {
          return models[name].destroy({ transaction, where: {} });
        }));
      });
    });

    Object.keys(CONST.entities).forEach(entity => {
      it(entity + ' "create" hooks', done => {
        models[entity].create(CONST[entity + 'Entity']).then(() => {
          dbHooks.slice(0, 2).forEach(hook => {
            hookInvoked(hook).should.be.true();
          });
          done();
        });
      })
    });

    // These tests fail. See:
    // https://github.com/mozilla-sensorweb/sensorthings/issues/246
    Object.keys(CONST.entities).forEach(entity => {
      xit(entity + ' "destroy" hooks', done => {
      models[entity].create(CONST[entity + 'Entity']).then(
        instance => {
          const id = instance.id;
          models[entity].destroy({
            where: { id } }).then(() => {
            dbHooks.slice(2, 4).forEach(hook => {
              hookInvoked(hook).should.be.true();
            });
            done();
          });
        });
      })
    });

    Object.keys(CONST.entities).forEach(entity => {
      it(entity + ' "update" hooks', done => {
      models[entity].create(CONST[entity + 'Entity']).then(
        instance => {
          models[entity].update({ name: 'newname' }, {
            where: { id: instance.id },
            individualHooks: true
          }).then(() => {
            dbHooks.slice(4).forEach(hook => {
              hookInvoked(hook).should.be.true();
            });
            done();
          });
        });
      })
    });
  });
});

