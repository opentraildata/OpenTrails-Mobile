'use strict';

(function (ng) {

  var module = ng.module('trails.routes', [ 'ngRoute' ]);

  module.config([

    '$routeProvider',

    function ($routeProvider) {

      $routeProvider.when('/search', {
        controller: 'SearchCtrl',
        templateUrl: 'views/search.html'
      });

      $routeProvider.when('/notifications', {
        controller: 'NotificationsCtrl',
        templateUrl: 'views/notifications.html'
      });

      $routeProvider.otherwise({
        redirectTo: '/'
      });

    }

  ]);

})(angular);
