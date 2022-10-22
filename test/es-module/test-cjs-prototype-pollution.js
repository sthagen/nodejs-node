'use strict';

const { mustNotCall, mustCall } = require('../common');

Object.defineProperties(Array.prototype, {
  // %Promise.all% and %Promise.allSettled% are depending on the value of
  // `%Array.prototype%.then`.
  then: {},
});
Object.defineProperties(Object.prototype, {
  then: {
    set: mustNotCall('set %Object.prototype%.then'),
    get: mustNotCall('get %Object.prototype%.then'),
  },
});

import('data:text/javascript,').then(mustCall());
