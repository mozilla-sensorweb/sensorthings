import { route } from '../../utils';

const pattern = route.separateBy(',', route.pathToModel);

module.exports = {
  validate: (value) => {
    return new RegExp('^' + pattern + '$').test(value);
  }
};
