import commonTests  from './common';

const mandatory     = ['name', 'description', 'definition'];
const associations  = ['Datastreams'];

commonTests('ObservedProperties', mandatory, [], associations);
