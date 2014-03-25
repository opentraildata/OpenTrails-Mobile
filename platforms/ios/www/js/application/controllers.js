'use strict';

(function (ng) {

  var module = ng.module('trails.controllers', []);

  module.controller('ApplicationCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {

      $scope.go = function () {
        alert('fuck');
      }

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

  module.controller('MapsCtrl', [

    '$scope',
    'Map',
    'GeoPosition',
    'GeoPositionMarker',

    function ($scope, Map, GeoPosition, GeoPositionMarker) {

      Map.setView(Map.DEFAULT_CENTER, Map.DEFAULT_ZOOM)

      var positionMarker = new GeoPositionMarker({
        position: Map.getCenter(),
        options: {
          clickable: false
        }
      });

      positionMarker.addTo(Map);

      var onGeolocationSuccess = function (position) {
        positionMarker.setPosition([position.coords.latitude,position.coords.longitude])
        GeoPosition.set(position.coords);
      }

      var onGeolocationError = function () {
        console.log('Error: Could not geolocate user');
      }

      var watchId = navigator.geolocation.watchPosition(
        onGeolocationSuccess,
        onGeolocationError
      );

      $scope.recenter = function () {
        Map.setView( positionMarker.getPosition(), Map.DEFAULT_ZOOM );
      }

    }
      
  ]);

  module.controller('MapLayersCtrl', [

    '$scope',
    'Map',
    'MapTileLayer',

    function ($scope, Map, MapTileLayer) {
      var layer = new MapTileLayer();
        
      layer.addTo(Map);

      $scope.setTiles = function (url) {
        layer.setUrl(url);
      }

      $scope.mapTileLayers = utils.values(MapTileLayer.INDEX);
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

      var markers = []
      var layers  = [];

      function renderLayer (t) {
        layers.push( MapTrailLayer.fromTrail(t).addTo(Map) );
      }

      function renderMarker (t) {
        markers.push( MapTrailHeadMarker.fromTrailHead(t).deselect().addTo(Map) );
      }

      function selectMarker (marker) {
        marker.select();
        if (marker.selected) {
          $scope.$apply(function() {
            $scope.selected = marker; 
          });
        }
      }

      function deselectMarker (marker) {
        marker.deselect();
        $scope.$apply(function() {
          $scope.selected = null;
        });
      }

      function onMarkerClick (marker) {
        if (!marker) return false;
        if ($scope.selected !== marker) {
          if ($scope.selected) {
            $scope.selected.deselect();
          }
          selectMarker(marker);
        } else {
          deselectMarker(marker);
        }
      }

      function bindEvents () {
        ng.forEach(markers, function (marker) {
          marker.on('click', function (e) {
            onMarkerClick(marker);
          });
        });
      }

      function onLoad (loaded) {
        if (loaded) {
          Models.Trail.query.each(renderLayer);
          Models.TrailHead.query.each(renderMarker);
          bindEvents();
        }
      }

      Map.on('click', function () {
        onMarkerClick($scope.selected);
      });

      $scope.$watch('selected', function (value) {
        console.log(value)
      });

      $scope.$watch(Models.loaded, onLoad);
    }

  ]);

  module.controller('NotificationsCtrl', [

    '$rootScope',
    '$scope',

    function ($rootScope, $scope) {

    }

  ]);

})(angular);
