'use strict';

(function (ng) {

  var module = ng.module('trails.controllers', []);

  module.controller('AppCtrl', [
    '$scope',
    'Map',
    'Models',
    'GeoPosition',
    'GeoPositionMarker',
    'MapTileLayer',
    'MapTrailLayer',
    'MapTrailHeadMarker',

    function ($scope, Map, Models, GeoPosition, GeoPositionMarker, MapTileLayer, MapTrailLayer, MapTrailHeadMarker) {


      //
      // VIEW LOGIC
      //

      $scope.visible = 'map';

      function show (id) {
        if ($scope.visible === id) {
          $scope.visible = 'map';
        } else {
          $scope.visible = id; 
        }
      } 

      $scope.show = show;

      //
      // MAP LOGIC
      //

      Map.setView(Map.DEFAULT_CENTER, Map.DEFAULT_ZOOM);

      var positionMarker = new GeoPositionMarker({
        position: Map.getCenter(),
        options: {
          clickable: false
        }
      });

      positionMarker.addTo(Map);

      function onGeoPositionSuccess (position) {
        positionMarker.setPosition([position.coords.latitude,position.coords.longitude])
        GeoPosition.set(position.coords);
      }

      function onGeoPositionError (err) {
        console.log('Error: Could not geolocate user');
      }

      var geoPositionWatchId = navigator.geolocation.watchPosition(
        onGeoPositionSuccess,
        onGeoPositionError
      );

      function recenter () {
        Map.setView( positionMarker.getPosition(), Map.DEFAULT_ZOOM );
      }

      $scope.recenter = recenter;

      //
      // MAP TILES LOGIC
      //

      var mapTileLayer = new MapTileLayer().addTo(Map);

      $scope.mapTileLayerUrl = mapTileLayer.getUrl();

      function setMapTileLayer (url) {
        mapTileLayer.setUrl(url);
        $scope.mapTileLayerUrl = url;
      }

      $scope.setMapTileLayer = setMapTileLayer;

      $scope.mapTileLayers = utils.values(MapTileLayer.INDEX);

      //
      // SEARCH LOGIC
      //

      $scope.searchResults = [];
      $scope.searchKeywords = '';

      function search (searchKeywords) {
        var query = {
          key: 'name',
          evaluator: 'contains',
          value: searchKeywords
        }

        var searchResults = Models.TrailHead.query.map(
          function (record) {
            var subrecords = record.trails.where(query).all();

            if ( subrecords.length > 0 ) {

              var distance = record.distanceFrom(
                GeoPosition.get('latitude'),
                GeoPosition.get('longitude')
              );

              return {
                record: record,
                subrecords: subrecords,
                distance: distance 
              };

            }
          }
        );

        $scope.searchResults = utils.compact(searchResults).sort(
          function (a,b) {
            return a.distance > b.distance; 
          }
        );
      }

      $scope.search = search;

      $scope.$watch('searchKeywords', function (searchKeywords) {
        if (searchKeywords) {
          $scope.search(searchKeywords);
        } else {
          $scope.searchResults = []; 
        }
      });


      //
      // TRAIL LAYERS LOGIC
      //

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

      function showTrailHead (th) {
        if ($scope.visible !== 'trails') show('trails');
        $scope.trailHead = th;
        $scope.steward = $scope.trailHead.stewards.first();
        $scope.trails = $scope.trailHead.trails.all();
        $scope.current = $scope.trails[0]
        $scope.distance = $scope.trailHead.distanceFrom(
          GeoPosition.get('latitude'),
          GeoPosition.get('longitude')
        );
      }

      $scope.showTrailHead = showTrailHead;

      $scope.$watch('selected', function (value) {
        if (value) {
          showTrailHead(value.get('record'))
        } else {
          show('map');
          $scope.trailHead = null;
          $scope.steward = null;
          $scope.trails = null;
          $scope.current = null;
          $scope.distance = null;
        }
      });

      $scope.nextTrail = function () {
        var index  = $scope.trails.indexOf($scope.current);
        var length = $scope.trails.length;
        if (index < length - 1) {
          $scope.current = $scope.trails[index + 1];
        }
      }

      $scope.previousTrail = function () {
        var index = $scope.trails.indexOf($scope.current);
        if (index > 0) {
          $scope.current = $scope.trails[index - 1];
        }
      }

      $scope.minimized = true;

      $scope.minimize = function () {
        $scope.minimized = true; 
      }

      $scope.maximize = function () {
        $scope.minimized = false; 
      }

      $scope.close = function () {
        $scope.trailVisible = false; 
      }

      $scope.$watch(Models.loaded, onLoad);

    }
    
  ]);

})(angular);
