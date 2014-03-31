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
                distance: distance(record) 
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
          search('');
        }
      });


      //
      // TRAIL LAYERS LOGIC
      //

      var markers = []
      var layers  = [];

      $scope.selectedTrailHead = null;
      $scope.selectedSteward = null;
      $scope.selectedTrail = null;
      $scope.trails = [];

      function onLoad (loaded) {
        if (loaded) {
          Models.Trail.query.each(renderLayer);
          Models.TrailHead.query.each(renderMarker);
          bindEvents();
          search('');
        }
      }

      function renderLayer (t) {
        layers.push( MapTrailLayer.fromTrail(t).addTo(Map) );
      }

      function renderMarker (t) {
        markers.push( MapTrailHeadMarker.fromTrailHead(t).deselect().addTo(Map) );
      }

      function selectMarker (marker) {
        if (marker) {
          marker.select();
          if (marker.selected) {
            $scope.$apply(function() {
              $scope.selected = marker; 
            });
          }
        }
      }

      function deselectMarker (marker) {
        if (marker) {
          marker.deselect();
          $scope.$apply(function() {
            $scope.selected = null;
          });
        }
      }

      function selectLayer (layer) {
        if (layer) {
          layer.select(); 
        }
      }

      function deselectLayer (layer) {
        if (layer) {
          layer.deselect();  
        }
      }

      function onMarkerClick (marker) {
        select( marker.get('record') );
      }

      function selectTrailHead (th) {
        if (!th) return false;
        $scope.$apply(function () {
          $scope.selectedTrailHead = th;
          $scope.selectedTrails = th.trails.all();
          $scope.selectedTrail = th.trails.first();
          $scope.selectedSteward = th.stewards.first();
        });
      }

      function deselectTrailHead (th) {
        if (!th) return false;
        $scope.$apply(function () {
          $scope.selectedTrailHead = null;
          $scope.selectedTrails = [];
          $scope.selectedTrail = null;
          $scope.selectedSteward = null;
        });
      }

      function selectTrail (t) {
        if (!t) return false;
        $scope.selectedTrail = t; 
      }

      function onMarkerClick (marker) {
        var trailHead = marker.get('record');
        if ( trailHead !== $scope.selectedTrailHead ) {
          selectTrailHead( trailHead )
        } else {
          deselectTrailHead( trailHead );
        }
      }

      function bindEvents () {
        ng.forEach(markers, function (marker) {
          marker.on('click', function (e) {
            onMarkerClick(marker);
          });
        });
      }

      Map.on('click', function () {
        deselectTrailHead( $scope.selectedTrailHead );
      });

      $scope.$watch('selectedTrailHead', function (value) {
        ng.forEach(markers, function (marker) {
          if (marker.get('record') === value) {
            marker.select();
          } else {
            marker.deselect(); 
          }
        });
        if (value) {
          if ($scope.visible !== 'trails') show('trails');
        } else {
          if ($scope.visible !== 'map') show('map');
        }
      });

      $scope.$watch('selectedTrail', function (value) {
        ng.forEach(layers, function (layer) {
          if (layer.get('record') === value)  {
            selectLayer(layer);
          } else {
            deselectLayer(layer);
          }
        });
      });

      $scope.nextTrail = function () {
        var index  = $scope.selectedTrails.indexOf($scope.selectedTrail);
        var length = $scope.selectedTrails.length;
        if (index < length - 1) {
          $scope.selectedTrail = $scope.selectedTrails[index + 1];
        }
      }

      $scope.previousTrail = function () {
        var index = $scope.selectedTrails.indexOf($scope.selectedTrail);
        if (index > 0) {
          $scope.selectedTrail = $scope.selectedTrails[index - 1];
        }
      }

      $scope.$watch(Models.loaded, onLoad);

      $scope.close = function () {
        show('map');
      }

      function distance (th) {
        return th.distanceFrom(GeoPosition.get('latitude'), GeoPosition.get('longitude'));
      }

      $scope.distance = distance;

      var trailView = document.getElementById('trail-view');

      var posY = trailView.offsetTop;
      var posYMin = -posY;
      var posYMax = 0;

      $scope.drag = function (e) {
        var delta;

        if (e.gesture.deltaY > 0) {
          delta = 40; 
        } else {
          delta = -40; 
        }

        posY = posY + delta;

        if (posY <= posYMin) {
          posY = posYMin; 
        } else if (posY >= posYMax) {
          posY = posYMax; 
        }

        var transform = "translate3d(0px,"+ posY+ "px, 0)";

        trailView.style.transform = transform;
        trailView.style.oTransform = transform;
        trailView.style.msTransform = transform;
        trailView.style.mozTransform = transform;
        trailView.style.webkitTransform = transform;
      }

      $scope.dragEnd = function () {
        if (posY == posYMax) {
          $scope.canClose = true;
        } else {
          $scope.canClose = false; 
        }
      }

 
    }

   
  ]);

})(angular);
