import commonTests  from './common';

const mandatory     = ['name', 'description', 'definition'];
const associations  = { 'Datastreams': 'Datastreams' };

commonTests('ObservedProperties', mandatory, [], associations);
