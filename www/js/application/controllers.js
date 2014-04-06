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
      // CONSTANTS
      //

      var DEFAULT_VIEW = 'map'

      //
      // VIEW LOGIC
      //

      $scope.view = DEFAULT_VIEW;

      function toggleView (id) {
        $scope.view === id ? showView(DEFAULT_VIEW) : showView(id);
      } 

      $scope.toggleView = toggleView;

      function showView (id) {
        $scope.view = id; 
      }

      $scope.showView = showView;

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

      navigator.geolocation.watchPosition(
        onGeoPositionSuccess,
        onGeoPositionError
      );

      function recenter () {
        Map.setView( positionMarker.getPosition(), Map.DEFAULT_ZOOM );
      }

      $scope.recenter = recenter;

      function onMapClick () {
        $scope.$apply(function () {
          deselectTrailHead($scope.selectedTrailHead);
        });
      }

      Map.on('click', function () {
        onMapClick()
      });

      //
      // MAP TILES LOGIC
      //

      var mapTileLayer = new MapTileLayer({}).addTo(Map);

      $scope.mapTileLayerUrl = mapTileLayer.getUrl();

      $scope.mapTileLayers = utils.values(MapTileLayer.INDEX);

      function setMapTileLayer (url) {
        mapTileLayer.setUrl(url);
        $scope.mapTileLayerUrl = url;
      }

      $scope.setMapTileLayer = setMapTileLayer;

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

              var dist;
              if (record) {
                dist = distance(record);
              }

              return {
                record: record,
                subrecords: subrecords,
                distance: dist
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

      var trailHeadMarkers = []
      var trailLayers  = [];

      $scope.selectedTrailHead = null;
      $scope.selectedSteward = null;
      $scope.selectedTrail = null;
      $scope.selectedTrails = [];

      function onLoad (loaded) {
        if (loaded) {
          Models.Trail.query.each(renderTrailLayer);
          Models.TrailHead.query.each(renderTrailHeadMarker);
          bindEvents();
          search('');
        }
      }

      function renderTrailLayer (t) {
        trailLayers.push( MapTrailLayer.fromTrail(t).addTo(Map) );
      }

      function renderTrailHeadMarker (t) {
        trailHeadMarkers.push( MapTrailHeadMarker.fromTrailHead(t).addTo(Map) );
      }

      function selectTrailHeadMarker (marker) {
        if (marker) {
          marker.select();
          if (marker.selected) {
            $scope.$apply(function() {
              $scope.selected = marker; 
            });
          }
        }
      }

      function deselectTrailHeadMarker (marker) {
        if (marker) {
          marker.deselect();
          $scope.$apply(function() {
            $scope.selected = null;
          });
        }
      }

      function selectTrailLayer (layer) {
        if (layer) {
          layer.select(); 
        }
      }

      function deselectTrailLayer (layer) {
        if (layer) {
          layer.deselect();  
        }
      }

      function onTrailHeadMarkerClick (marker) {
        var record = marker.get('record');
        if ( record !== $scope.selectedTrailHead ) {
          $scope.$apply(function () { selectTrailHead( record ) });
        } else {
          $scope.$apply(function () { deselectTrailHead( record ) });
        }
      }

      function bindEvents () {
        ng.forEach(trailHeadMarkers, function (marker) {
          marker.on('click', function (e) {
            onTrailHeadMarkerClick(marker);
          });
        });
      }

      function selectTrailHead (th, t) {
        if (!th || ng.isUndefined(th)) return false;
        $scope.selectedTrailHead = th;
        $scope.selectedTrails = th.trails.all();
        $scope.selectedTrail = t || th.trails.first();
        $scope.selectedSteward = th.stewards.first();
      }

      $scope.selectTrailHead = selectTrailHead;

      function deselectTrailHead (th) {
        if (!th || ng.isUndefined(th)) return false;
        $scope.selectedTrailHead = null;
        $scope.selectedTrails = [];
        $scope.selectedTrail = null;
        $scope.selectedSteward = null;
      }

      function selectTrail (t) {
        if (!t || ng.isUndefined(t)) return false;
        $scope.selectedTrail = t; 
      }

      $scope.selectTrail = selectTrail;

      $scope.$watch('selectedTrailHead', function (value) {

        ng.forEach(trailHeadMarkers, function (marker) {
          if (marker.get('record') === value) {
            marker.select();
          } else {
            marker.deselect();
          }
        });

        if (value) {
          showView('trails');
        } else {
          showView(DEFAULT_VIEW);
        }

      });

      $scope.$watch('selectedTrail', function (value) {
        ng.forEach(trailLayers, function (layer) {
          if (layer.get('record') === value)  {
            selectTrailLayer(layer);
          } else {
            deselectTrailLayer(layer);
          }
        });
        if (value) {
          showView('trails');
        } else {
          showView(DEFAULT_VIEW);
        }

        // #HACK -- sets height of trail view dynamically
        // based upon the height of its constituent elements.
        // Let's find a more elegant solution for this.

        setTimeout(setTrailViewOffset, 50);
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

      function setTrailViewOffset() {
          var trailView = document.getElementById('trail-view'),
              footerHeight = document.getElementById('footer').offsetHeight,
              attributesHeight = document.getElementsByClassName('trail-attributes')[0].offsetHeight,
              trailNavHeight = document.getElementsByClassName('trail-nav')[0].offsetHeight,
              viewportHeight = window.innerHeight,
              initialOffset = viewportHeight - footerHeight - trailNavHeight - attributesHeight;

              trailView.style.top = initialOffset + 'px';
      };


      function distance (th) {
        if (th) {
          return th.distanceFrom(GeoPosition.get('latitude'), GeoPosition.get('longitude'));
        }
      }

      $scope.distance = distance;

    }

  ]);

})(angular);
