'use strict';

(function (ng) {

  var module = ng.module('trails.routes', [ 'ngRoute' ]);

  module.config([

    '$routeProvider',

    function ($routeProvider) {

      $routeProvider.when('/', {
        controller: 'HomeCtrl',
        templateUrl: 'partials/home.html'
      });

      $routeProvider.when('/explore', {
        controller: 'ExploreCtrl',
        templateUrl: 'partials/explore.html'
      });

      $routeProvider.when('/notifications', {
        controller: 'NotificationsCtrl',
        templateUrl: 'partials/notifications.html'
      });

      $routeProvider.otherwise({
        redirectTo: '/'
      });

    }

  ]);

})(angular);
