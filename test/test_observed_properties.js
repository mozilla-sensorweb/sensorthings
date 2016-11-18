import commonTests  from './common';
import { observedProperties } from './constants';

const mandatory     = ['name', 'description', 'definition'];

commonTests(observedProperties, 8886, mandatory, []);
