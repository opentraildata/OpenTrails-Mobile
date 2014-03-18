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
          if ($scope[view+'Visible']) {
            $scope[view+'Visible'] = !$scope[view+'Visible'];
            $scope.mapVisible = true;
          } else {
            this.reset();
            $scope[view+'Visible'] = true
          }
        },

        reset: function () {
          $scope.mapVisible = false;      
          $scope.searchVisible = false;
          $scope.notificationsVisible = false;
          $scope.layersVisible = false;
        },

        templates: {
          "map": 'views/map.html',
          "search": 'views/search.html',
          "notifications": 'views/notifications.html'
        }
      }

      $scope.views = views;

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
      $scope.map = new Map();
      $scope.layer = new Map.TileLayer('terrain');
      $scope.map.addLayer($scope.layer);

      $scope.recenter = function () {
        console.log('Recenter map') 
      }
    }
      
  ]);

  module.controller('MapLayersCtrl', [

    '$scope',
    'Application',
    'Map',

    function ($scope, Application, Map) {

      $scope.layers = Map.TileLayer.INDEX;

      $scope.setLayer = function (layer) {
        if (Application.map) {
          console.log("Setting layer to: " + layer.name);
        } else {
          throw "MapLayersCtrl: no map found" 
        }
      }

    }

  ]);

  module.controller('SearchCtrl', [

    '$rootScope',
    '$scope',
    'TrailHead',

    function ($rootScope, $scope, TrailHead) {

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

    function ($rootScope, $scope) {

    }

  ]);

})(angular);
