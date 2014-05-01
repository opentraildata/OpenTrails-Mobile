'use strict';

(function (ng) {

  var module = ng.module('trails.controllers', []);

  module.controller('NotificationsCtrl', [

    '$scope',
    'Models',
    'GeoPosition',

    function ($scope, Models, GeoPosition) {

      // Instantiate variables

      var index = 0;

      // Wait until all models have been
      // loaded to instantiate variables

      $scope.$watch(Models.loaded, function (value) {
        $scope.stewards = Models.Steward.query.all();
        $scope.steward  = $scope.stewards[index];
      });

      // Navigate to next steward

      $scope.next = function () {
        if ( canNext() ) {
          $scope.steward = $scope.stewards[++index];
        }
      }

      // Navigate to previous steward

      $scope.previous = function () {
        if ( canPrevious() ) {
          $scope.steward = $scope.stewards[--index];
        }
      }

      // Returns whether or not a previous
      // steward exists

      function canPrevious () {
        return index > 0;
      }

      $scope.canPrevious = canPrevious;

      // Returns whether or not a subsequent
      // steward exists

      function canNext () {
        return index < ($scope.stewards.length - 1);
      }

      $scope.canNext = canNext;

      // Watch current steward, and set notifications
      // when it changes

      $scope.$watch('steward', function (value) {
        if (value) {
          $scope.notifications = $scope.steward.notifications.all();
        } else {
          $scope.notifications = [];
        }
      });

      // Mark notification as read when closed

      $scope.closeNotification = function (notification) {
        if (notification) {
          notification.markAsRead();
        }
      }

      // Set geoposition for address lookup

      $scope.geoposition = GeoPosition;

    }

  ]);

  module.controller('AppCtrl', [
    '$scope',
    'Map',
    'Models',
    'GeoPosition',
    'GeoPositionMarker',
    'MapTileLayer',
    'MapTrailLayer',
    'MapTrailHeadMarker',
    'MapMarkerClusterGroup',
    'TrailSearch',
    'TrailsCanvasLayer',

    function ($scope, Map, Models, GeoPosition, GeoPositionMarker, MapTileLayer, MapTrailLayer, MapTrailHeadMarker, MapMarkerClusterGroup, TrailSearch, TrailsCanvasLayer) {

      //
      // CONSTANTS
      //

      var MAP_VIEW = 'map';
      var TRAILS_VIEW = 'trails';
      var USE_CANVAS_TRAILS = true;

      //
      // VIEW LOGIC
      //

      $scope.view = MAP_VIEW;

      function toggleView (id) {
        if ($scope.view === id)
          $scope.selectedTrailHead === null ? showView(MAP_VIEW) : showView(TRAILS_VIEW);
        else
          showView(id);
      }

      $scope.toggleView = toggleView;

      function showView (id) {
        $scope.view = id;
      }

      $scope.showView = showView;


      // Notifications view settings
      //
      // Active tab in notifications.
      $scope.isActiveTab = function(tab) {
        return tab === $scope.view;
      }

      // prevent scrolling when not in fullscreen mode
      document.getElementsByClassName('trail-and-trailhead-data')[0].addEventListener('touchmove', function (event) {
        if (!$scope.fullscreen) {
          event.preventDefault();
        }
      });

      // when leaving fullscreen mode, make sure we scroll back to the top
      $scope.$watch('fullscreen', function(value) {
        if (!value) {
          document.getElementsByClassName('trail-and-trailhead-data')[0].scrollTop = 0;
        }
      })

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
        positionMarker.removeFrom(Map);
      }

      navigator.geolocation.watchPosition(
        onGeoPositionSuccess,
        onGeoPositionError
      );

      $scope.geoposition = GeoPosition;

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
      var currentLayer = "terrain";

      function toggleMapTileLayer () {
        currentLayer = (currentLayer === "terrain" ? "satellite" : "terrain");
        mapTileLayer.setUrl(MapTileLayer.INDEX[currentLayer].url);
      }

      $scope.toggleMapTileLayer = toggleMapTileLayer;

      //
      // SEARCH LOGIC
      //

      $scope.searchResults = [];

      function search (keywords, filters) {
        $scope.lastSearch = keywords;
        $scope.searchResults = TrailSearch.perform({ keywords: keywords, filters: filters, position: GeoPosition });
      }

      $scope.search = search;

      function clearSearch () {
        $scope.lastSearch = null; 
        $scope.searchKeywords = null;
        $scope.searchFilters = {
          canFoot: false,
          canBicycle: false,
          canHorse: false,
          canSki: false
        };
        $scope.search();
      }

      $scope.clearSearch = clearSearch;

      var searchFilterState = false

      function setSearchFilter (key) {
        searchFilterState = !searchFilterState;
        $scope.searchFilters[key] = searchFilterState;
        search($scope.searchKeywords, $scope.searchFilters);
      }

      $scope.setSearchFilter = setSearchFilter;

      clearSearch();

      //
      // TRAIL LAYERS LOGIC
      //

      var trailHeadCluster = new MapMarkerClusterGroup();
      var trailHeadMarkers = []
      var trailLayers  = [];

      $scope.selectedTrailHead = null;
      $scope.selectedSteward = null;
      $scope.selectedTrail = null;
      $scope.selectedPhoto = null;
      $scope.selectedTrails = [];

      var trailsLayer;
      function onLoad (loaded) {
        if (loaded) {
          $scope.stewards = Models.Steward.query.all();
          $scope.selectedSteward = Models.Steward.query.first();

          if (USE_CANVAS_TRAILS) {
            trailsLayer = (new TrailsCanvasLayer({
              trails: Models.Trail.query.all()
            })).addTo(Map.delegate);
          }
          else {
            Models.Trail.query.each(renderTrailLayer);
          }

          Models.TrailHead.query.each(renderTrailHeadMarker);
          trailHeadCluster.addTo(Map);
          bindEvents();
          search('');
        }
      }

      function renderTrailLayer (t) {
        trailLayers.push( MapTrailLayer.fromTrail(t).addTo(Map) );
      }

      function renderTrailHeadMarker (t) {
        var marker = MapTrailHeadMarker.fromTrailHead(t);
        trailHeadMarkers.push(marker);
        trailHeadCluster.addLayer(marker);
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
        $scope.selectedPhoto = $scope.selectedTrail.photo.first()
        $scope.selectedTrailHeadSteward = th.stewards.first();
      }

      $scope.selectTrailHead = selectTrailHead;

      function deselectTrailHead (th) {
        if (!th || ng.isUndefined(th)) return false;
        $scope.selectedTrailHead = null;
        $scope.selectedTrails = [];
        $scope.selectedTrail = null;
        $scope.selectedPhoto = null;
        $scope.selectedSteward = null;
      }

      function selectTrail (t) {
        if (!t || ng.isUndefined(t)) return false;
        $scope.selectedTrail = t;
        $scope.selectedPhoto = t.photo.first();
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
          showView(MAP_VIEW);
        }

      });

      $scope.$watch('selectedTrail', function (value) {
        var fitOptions = {
          paddingBottomRight: [0, 250]
        };

        if (trailsLayer) {
          trailsLayer.highlight(value);
          if (trailsLayer.highlighted) {
            Map.fitBounds(trailsLayer.highlighted.bounds, fitOptions);
          }
        }

        ng.forEach(trailLayers, function (layer) {
          if (layer.get('record') === value)  {
            selectTrailLayer(layer);
            Map.fitBounds( layer.getBounds(), fitOptions );
          } else {
            deselectTrailLayer(layer);
          }
        });
        if (value) {
          showView('trails');
        } else {
          showView(MAP_VIEW);
        }

        // #HACK -- sets height of trail view dynamically
        // based upon the height of its constituent elements.
        // Let's find a more elegant solution for this.

        setTimeout(setTrailViewOffset, 50);
      });

      $scope.nextTrail = function () {
        var index  = $scope.selectedTrails.indexOf($scope.selectedTrail);
        if ( canNextTrail() ) {
          $scope.selectedTrail = $scope.selectedTrails[index + 1];
        }
      }

      function canNextTrail () {
        return $scope.selectedTrails.indexOf($scope.selectedTrail) < ($scope.selectedTrails.length - 1)
      }

      $scope.canNextTrail = canNextTrail;

      $scope.previousTrail = function () {
        var index = $scope.selectedTrails.indexOf($scope.selectedTrail);
        if ( canPreviousTrail() ) {
          $scope.selectedTrail = $scope.selectedTrails[index - 1];
        }
      }

      function canPreviousTrail () {
        return $scope.selectedTrails.indexOf($scope.selectedTrail) > 0;
      }

      $scope.canPreviousTrail = canPreviousTrail;

      function closeTrailView () {
        $scope.fullscreen = false; 
        deselectTrailHead($scope.selectedTrailHead);
      }

      $scope.closeTrailView = closeTrailView;

      function setTrailViewOffset() {
          var trailView = document.getElementById('trail-view'),
              footerHeight = document.getElementById('footer').offsetHeight,
              attributesHeight = document.getElementsByClassName('trail-attributes')[0].offsetHeight,
              trailNavHeight = document.getElementsByClassName('trail-nav')[0].offsetHeight,
              viewportHeight = window.innerHeight,
              initialOffset = viewportHeight - footerHeight - trailNavHeight - attributesHeight;

              trailView.style.webkitTransform = 'translate3d(0, ' + initialOffset + 'px, 0)';
      };


      function distance (th) {
        if (th) {
          return th.distanceFrom(GeoPosition.get('latitude'), GeoPosition.get('longitude'));
        }
      }

      $scope.distance = distance;

      // On Load

      $scope.$watch(Models.loaded, onLoad);
    }

  ]);

})(angular);
