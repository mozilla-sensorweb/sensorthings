import { route } from '../../utils';

const property = '[a-z]\\w+';
const modelOrProperty = route.singularAndPlural.join('|') + '|' + property;
const pattern = route.separateBy(',', route.noCapture(modelOrProperty));

module.exports = {
  validate: (value) => {
    return new RegExp('^' + pattern + '$').test(value);
  }
};
