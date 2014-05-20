(function (ng, fc) {
  'use strict';

  var module = ng.module('trails', [
    'trails.routes',
    'trails.controllers',
    'trails.services',
    'trails.directives'
  ]);

  var onDeviceReady = function () {
    ng.bootstrap(document, ['trails']);
  };

  document.addEventListener('deviceready', onDeviceReady, false);

  window.addEventListener('load', function() {
    fc.attach(document.body);
  }, false);

})(angular, FastClick);