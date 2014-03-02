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

      window.TrailHead = TrailHead

      $scope.loading = false;
      $scope.results = [];

      $scope.$watch('keywords', function (keywords) {
        if (keywords) {
          $scope.search(keywords);
        } else {
          $scope.results = TrailHead.all; 
        }
      });

      $scope.search = function (keywords) {
        $scope.results = TrailHead.search(keywords);
      }

    }

  ]);

  module.controller('NotificationsCtrl', [

    '$rootScope',
    '$scope',
    'AlertNotification',
    'EventNotification',

    function ($rootScope, $scope, AlertNotification, EventNotification) {

      $scope.active = 'alerts';
      $scope.events = EventNotification.all;
      $scope.alerts = AlertNotification.all;

    }

  ]);

})(angular);
