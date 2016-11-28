import { route } from '../../utils';

const ascDesc = 'asc|desc';
const property = '[a-z]\\w+';
const pathToModel = route.noCapture(route.pathToModel + '\\/') + '?';
const pathToProperty = pathToModel + route.noCapture(property);
const direction = route.noCapture(' ' + route.noCapture(ascDesc));
const pattern = pathToProperty + direction  + '?';

module.exports = {
  validate: (value) => {
    return new RegExp('^' + route.separateBy(', ', pattern) + '$').test(value);
  }
};
