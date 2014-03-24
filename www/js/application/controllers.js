'use strict';

(function (ng) {

  var module = ng.module('trails.controllers', []);

  module.controller('ApplicationCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {

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
    'Map',
    'CurrentPositionMarker',

    function ($scope, Map, CurrentPositionMarker) {

      var positionMarker = new CurrentPositionMarker({
        position: Map.DEFAULT_ORIGIN,
        options: {
          clickable: false
        }
      });

      positionMarker.addTo(Map);

      var onGeolocationSuccess = function (position) {
        $scope.currentPosition = position;
      }

      var onGeolocationError = function () {
        console.log('Error: Could not geolocate user');
      }

      var watchId = navigator.geolocation.watchPosition(
        onGeolocationSuccess,
        onGeolocationError
      );

      $scope.recenter = function () {
        Map.setView(positionMarker.getPosition(), Map.DEFAULT_ZOOM);
      }

      Map.on('click', function () {
        console.log('map clicked');
      });

    }
      
  ]);

  module.controller('MapLayersCtrl', [

    '$scope',
    'Map',
    'TileLayer',

    function ($scope, Map, TileLayer) {

      $scope.setLayer = function (layer) {
        Map.setTileLayer(layer.id);
      }

      $scope.layers = TileLayer.ALL_LAYERS;
    }

  ]);

  module.controller('SearchCtrl', [

    '$scope',
    'Models',

    function ($scope, Models) {

      $scope.loading = false;
      $scope.results = [];

      $scope.$watch('keywords', function (keywords) {
        if (keywords) {
          $scope.search(keywords);
        } else {
          $scope.results = []; 
        }
      });

      $scope.search = function (keywords) {
        $scope.results = Models.Trail.query.where({
          key: 'name',
          evaluator: 'contains',
          value: keywords
        }).all();
      }

    }

  ]);

  module.controller('TrailsCtrl', [

    '$scope',
    'Map',
    'Models',
    'MapTrailLayer',
    'MapTrailHeadMarker',

    function ($scope, Map, Models, MapTrailLayer, MapTrailHeadMarker) {

      var renderTrails = function () {

        Models.Trail.query.each(function (trail) {
          renderTrail(trail)
        }); 

        Models.TrailHead.query.each(function (trailHead) {
          renderTrailHead(trailHead)
        }); 

      }

      var renderTrail = function (trail) {
        var marker = new MapTrailLayer({ geojson: trail.toGeoJson() })

        marker.addTo(Map);

        return marker;
      }

      var renderTrailHead = function (trailHead) {
        var marker = new MapTrailHeadMarker({ position: trailHead.toPosition().toArray() });

        marker.addTo(Map);

        marker.on('click', function () {
          console.log(trailHead.get('name'));
        });

        return marker;
      }

      var renderMapData = function () {
        renderTrails();
      }

      $scope.$watch(Models.loaded, function (loaded) {
        if (loaded) renderMapData();
      });
    }

  ]);


  module.controller('NotificationsCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {

    }

  ]);

})(angular);
