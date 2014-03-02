'use strict';

(function (ng) {

  var module = ng.module('trails.controllers', []);

  module.controller('ApplicationCtrl', [

    '$rootScope',

    function ($rootScope) {
      $rootScope.header = 'To The Trails'
      $rootScope.call = function (number) {
        confirm('Are you sure you would like to call "' + number + '"?');
      }
    }

  ]);

  module.controller('HomeCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {
      $rootScope.header = 'Home';
    }

  ]);

  module.controller('ExploreCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {
      $rootScope.header = 'Explore';
    }

  ]);

  module.controller('InfoCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {
      $rootScope.header = 'Info';
    }

  ]);

})(angular);
