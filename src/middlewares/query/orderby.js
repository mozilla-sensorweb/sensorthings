import { route } from '../../utils';

const ascDesc = 'asc|desc';
const property = '[a-z]\\w+';
const pathToModel = route.noCapture(route.pathToModel + '\\/') + '?';
const pathToProperty = pathToModel + route.noCapture(property);
const direction = route.noCapture(' ' + route.noCapture(ascDesc));
const pattern = pathToProperty + direction + '?';

module.exports = {
  validate: (value) => {
    const comma = route.noCapture(',|, ');
    return new RegExp('^' + route.separateBy(comma, pattern) + '$').test(value);
  }
};
