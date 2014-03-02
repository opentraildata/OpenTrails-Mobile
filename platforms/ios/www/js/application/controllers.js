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

      $scope.header = 'Metro Parks Serving Summit County';

      var origin = [ 41.082020, -81.518506 ];

      var map = L.map('map', {zoomControl: false});
      map.setView(origin, 13);

      var layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {detectRetina: true});
      layer.addTo(map);

      var icon = L.icon({
        iconUrl: 'img/location.png',
        iconSize: [20,20]
      })

      var marker = L.marker(origin, {icon: icon}).addTo(map);
      map.addLayer(marker);

      marker.on('click', function () { map.setView(marker.getLatLng(), 16) })

      var opacity = 1;
      var fading = true;

      setInterval(function () {

        if (opacity < 0.7 && fading === true) {
          fading = false;
        }

        if (opacity > 1 && fading === false) {
          fading = true;
        }

        if (fading) {
          opacity = opacity - 0.01; 
        } else {
          opacity = opacity + 0.02;
        }

        marker.setOpacity(opacity);

      },40)

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
