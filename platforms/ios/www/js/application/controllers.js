'use strict';

(function (ng) {

  var module = ng.module('trails.controllers', []);

  module.controller('ApplicationCtrl', [

    '$rootScope',

    function ($rootScope) {
      $rootScope.call = function (number) {
        confirm('Are you sure you would like to call "' + number + '"?');
      }
    }

  ]);

  module.controller('HomeCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {
      $scope.header = 'Home';
    }

  ]);

  module.controller('ExploreCtrl', [

    '$rootScope',
    '$scope',
    'TrailHead',

    function ($rootScope, $scope, TrailHead) {

      $scope.loading = false;
      $scope.results = TrailHead.all;

      $scope.$watch('keywords', function (keywords) {
        $scope.search(keywords);
      });

      $scope.search = function (keywords) {
        $scope.results = TrailHead.search(keywords);
      }

    }

  ]);

  module.controller('InfoCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {
      $scope.header = 'Info';
    }

  ]);

})(angular);
