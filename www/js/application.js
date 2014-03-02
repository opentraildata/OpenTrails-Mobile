'use strict';

(function (ng) {

  var module = ng.module('trails', [
    'trails.routes',
    'trails.controllers'
  ]);

  var onDeviceReady = function () {
    ng.bootstrap(document, ['trails']);
  }

  document.addEventListener('deviceready', onDeviceReady, false);

})(angular);
