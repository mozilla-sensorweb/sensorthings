import { route } from '../../utils';

const pattern = route.noCapture('\\d+');

module.exports = {
  validate: (value) => {
    return new RegExp('^' + pattern + '$').test(value);
  }
};
