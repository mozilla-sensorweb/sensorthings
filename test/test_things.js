import commonTests from './common';
import { things } from './constants';

const mandatory = ['name', 'description'];
const optional = ['properties'];

commonTests(things, 8888, mandatory, optional);
