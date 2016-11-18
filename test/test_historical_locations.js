import commonTests from './common';
import { historicalLocations } from './constants';

const mandatory     = ['time'];

commonTests(historicalLocations, 8882, mandatory);
