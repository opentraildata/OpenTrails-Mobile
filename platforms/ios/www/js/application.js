'use strict';

(function (ng, fc) {

  var module = ng.module('trails', [
    'trails.routes',
    'trails.controllers',
    'trails.services'
  ]);

  var onDeviceReady = function () {
    ng.bootstrap(document, ['trails']);
  }

  document.addEventListener('deviceready', onDeviceReady, false);

  window.addEventListener('load', function() {
    fc.attach(document.body);
  }, false);

})(angular, FastClick);
