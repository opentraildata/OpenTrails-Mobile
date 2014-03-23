'use strict';

(function (ng) {

  var module = ng.module('trails.controllers', []);

  module.controller('ApplicationCtrl', [

    '$rootScope',
    '$scope',
    'Application',

    function ($rootScope, $scope, Application) {

      // Views

      var views = {
        current: 'map',

        render: function (view) {
          this.current = view;

          this.reset();

          switch (view) {
            case 'map':
              $scope.mapVisible = true;
              break;
            case 'search':
              $scope.searchVisible = true;
              break;
            case 'notifications':
              $scope.notificationsVisible = true;
              break;
            case 'map-layers':
              $scope.mapVisible = true;
              $scope.mapLayersVisible = !$scope.mapLayersVisible;
              break;
            default:
              return false;
          };
        },

        reset: function () {
          $scope.mapVisible = false;      
          $scope.searchVisible = false;
          $scope.notificationsVisible = false;
          $scope.layersVisible = false;
        },

        templates: {
          "map": 'views/map.html',
          "trail": 'views/trail.html',
          "search": 'views/search.html',
          "notifications": 'views/notifications.html'
        }
      }

      $scope.views = views;
      $scope.views.render('map');

      // Partials

      var partials = {
        "templates": {
          "footer": 'partials/footer.html',
          "layers": 'partials/layers.html'
        }
      }


      $scope.partials = partials;
    }

  ]);

  module.controller('MapCtrl', [

    '$scope',
    'Application',
    'Map',

    function ($scope, Application, Map) {
      var map = Application.map;

      $scope.recenter = function () {
        map.setView(map.DEFAULT_ORIGIN, map.DEFAULT_ZOOM);
      }

      map.on('click', function () {
        console.log('map clicked');
      });

      $scope.map = map;
    }
      
  ]);

  module.controller('MapLayersCtrl', [

    '$scope',
    'Application',
    'Map',

    function ($scope, Application, Map) {
      var map = Application.map;

      $scope.setLayer = function (layer) {
        if (Application.map) {
          map.setTileLayer(layer.id);
        } else {
          throw "MapLayersCtrl: no map found" 
        }
      }

      $scope.layers = Map.TileLayer.ALL_LAYERS;
    }

  ]);

  module.controller('SearchCtrl', [

    '$scope',
    'Application',
    'Models',

    function ($scope, Application, Models) {

      $scope.loading = false;
      $scope.results = [];

      $scope.currentPosition = Application.currentPosition.position;

      $scope.$watch('keywords', function (keywords) {
        if (keywords) {
          $scope.search(keywords);
        } else {
          $scope.results = []; 
        }
      });

      $scope.search = function (keywords) {
        $scope.results = [];
      }

    }

  ]);

  module.controller('TrailsCtrl', [

    '$scope',
    'Application',
    'Models',

    function ($scope, Application, Models) {
      window.Models = Models;
    }

  ]);


  module.controller('NotificationsCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {

    }

  ]);

})(angular);
