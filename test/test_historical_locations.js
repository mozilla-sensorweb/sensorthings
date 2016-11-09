import commonTests from './common';
import * as CONST   from './constants';

const mandatory     = ['time'];
const optional      = [];
const associations  = [CONST.things, CONST.locations];

commonTests('HistoricalLocations', mandatory, optional, associations);
