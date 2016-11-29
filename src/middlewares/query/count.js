import { route } from '../../utils';

const pattern = route.noCapture('true|false');

module.exports = {
  validate: (value) => {
    return new RegExp('^' + pattern + '$').test(value);
  }
};
