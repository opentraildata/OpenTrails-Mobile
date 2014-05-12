'use strict';

(function (ng) {

  var module = ng.module('trails.controllers', []);

  module.controller('NotificationsCtrl', [

    '$scope',
    'Models',
    'GeoPosition',

    function ($scope, Models, GeoPosition) {

      // Instantiate variables

      var index = 0; // the currently showing steward.

      // Wait until all models have been
      // loaded to instantiate variables

      $scope.$watch(Models.loaded, function (value) {
        $scope.stewards = Models.Steward.query.all();
        $scope.steward  = $scope.stewards[index];
      });

      // Navigate to next steward

      $scope.nextSteward = function () {
        if ( index >= $scope.stewards.length-1 )
          index = -1;
        $scope.steward = $scope.stewards[++index];
      }

      // Navigate to previous steward

      $scope.previousSteward = function () {
        if ( index <= 0 )
          index = $scope.stewards.length;
        $scope.steward = $scope.stewards[--index];
      }

      function currentStewardPosition() {
        return index+1;
      }
      $scope.currentStewardPosition = currentStewardPosition;

      // Watch current steward, and set notifications
      // when it changes
      $scope.$watch('steward', function (value) {
        if (value) {
          $scope.notifications = $scope.steward.notifications.all();
        } else {
          $scope.notifications = [];
        }
      });

      $scope.selectedNotice = null;
      $scope.selectNotice = function (notification) {
        notification.markAsRead();
        if ($scope.selectedNotice === notification) 
          $scope.selectedNotice = null
        else
          $scope.selectedNotice = notification;
      }

      // Mark notification as read when closed

      $scope.closeNotification = function (notification) {
        if (notification)
          notification.markAsDeleted();
      };

      // Immensely hackish & expensive way of tracking a
      // count of total unread notifications.
      // TODO: Refactor this to update only when the 
      // closeNotification function is called.
      $scope.undeletedNotifications = function () {
        var numUndeleted = 0;
        for( var i in $scope.notifications )
        {
          if (!$scope.notifications[i].attributes.deleted) numUndeleted++;
        }
        return numUndeleted;
      };

      // Set geoposition for address lookup

      $scope.geoposition = GeoPosition;

      $scope.openInNativeMaps = function () {
        window.open('maps:q='+$scope.steward.get('address'), '_system');
      }

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
      // "CONSTANTS"
      //

      // Name of the views.
      var MAP_VIEW = 'map';
      var TRAILS_VIEW = 'trails';

      var USE_CANVAS_TRAILS = true;

      // UI element heights used for calculating offsets.
      var FOOTER_HEIGHT = document.getElementById('footer').offsetHeight;
      var TRAIL_NAV_HEIGHT = document.getElementById('trail-nav').offsetHeight;

      // DOM elements.
      var mapContainerElm = document.getElementById('map-container');
      var trailViewElm = document.getElementById('trail-view');
      var trailDataHeaderElm = document.getElementById('trail-data-header');
      var trailAndTrailheadDataElm = document.getElementById('trail-and-trailhead-data');

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
        if ($scope.view !== id) {
          if ($scope.view === TRAILS_VIEW && id === MAP_VIEW)
            closeTrailView();
          $scope.view = id;
        }
      }

      $scope.showView = showView;


      // Notifications view settings
      //
      // Active tab in notifications.
      $scope.isActiveTab = function(tab) {
        return tab === $scope.view;
      }

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

      //
      // MAP EVENT HANDLERS (added after map loads)
      //
      function onMapClick () {
        $scope.$apply(function () {
          deselectTrailHead($scope.selectedTrailHead);
        });
      }

      // Update zoom level CSS class when map is zoomed.
      var lastZoomClass; // The last zoom level class added
      function onMapZoom () {
        var zoomClass = 'map-zoom-'+Map.getZoom();
        mapContainerElm.classList.remove(lastZoomClass);
        mapContainerElm.classList.add(zoomClass);
        lastZoomClass = zoomClass;
      }

      //
      // MAP TILES LOGIC
      //

      var mapTileLayer = new MapTileLayer({}).addTo(Map);
      var currentLayer = "terrain";

      function toggleMapTileLayer () {
        currentLayer = (currentLayer === "terrain" ? "satellite" : "terrain");
        mapTileLayer.setUrl(MapTileLayer.INDEX[currentLayer].url);
        toggleView(TRAILS_VIEW);
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
      var trailHeadMarkers = [];
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

          // Add initial zoom level class to map container
          lastZoomClass = 'map-zoom-'+Map.getZoom();
          mapContainerElm.classList.add(lastZoomClass);

          // Add event listeners
          Map.on('click', onMapClick);
          Map.on('zoomend', onMapZoom);
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

      /*
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
      */

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

      function openTrailHeadInNativeMaps (trailhead) {
        var position = $scope.selectedTrailHead.getLatLng();
        window.open('maps:q='+position.join(','), '_system');
      }

      $scope.openTrailHeadInNativeMaps = openTrailHeadInNativeMaps;

      function selectTrailHead (th, t) {
        if (!th || ng.isUndefined(th)) return false;
        $scope.selectedTrailHead = th;
        $scope.selectedTrails = th.trails.all();
        $scope.selectedTrail = t || th.trails.first();
        $scope.selectedPhoto = $scope.selectedTrail.photo.first()
        $scope.selectedTrailHeadSteward = th.stewards.first();

        mapContainerElm.classList.add('trail-selected');

        // #HACK -- sets height of trail view dynamically
        // based upon the height of its constituent elements.
        // Let's find a more elegant solution for this.

        setTimeout(setTrailViewOffset, 50);
      }

      $scope.selectTrailHead = selectTrailHead;

      function deselectTrailHead (th) {
        if (!th || ng.isUndefined(th)) return false;
        $scope.selectedTrailHead = null;
        $scope.selectedTrails = [];
        $scope.selectedTrail = null;
        $scope.selectedPhoto = null;
        $scope.selectedSteward = null;

        mapContainerElm.classList.remove('trail-selected');
      }

      function selectTrail (t) {
        if (!t || ng.isUndefined(t)) return false;
        $scope.selectedTrail = t;
        $scope.selectedPhoto = t.photo.first();
      }

      $scope.selectTrail = selectTrail;

      // Remove the marker from the Marker clusters
      // and add it to the map so that it doesn't
      // combine with a cluster at zoomed out levels.
      function moveMarkerToMap(marker)
      {
        trailHeadCluster.removeLayer(marker);
        var index = trailHeadMarkers.indexOf(marker);
        if (index > -1) trailHeadMarkers.splice(index, 1);
        marker.addTo(Map);
      }

      // Add the marker to the Marker clusters
      // and remove it from the map so that it does
      // combine with a cluster at zoomed out levels.
      function moveMarkerToCluster(marker)
      {
        trailHeadMarkers.push(marker);
        marker.removeFrom(Map);
        trailHeadCluster.addLayer(marker);
      }

      var lastSelectedMarker; // The last marker that was selected
      $scope.$watch('selectedTrailHead', function (value) {

        var newMarkerSelected; // The new marker that was select, or null
        ng.forEach(trailHeadMarkers, function (marker) {

          if (marker.get('record') === value) {
            newMarkerSelected = marker;
          }

        });

        // NOTE: This scenario occurs when a marker is clicked.
        // If a new marker was selected, deselect the old marker
        // and move it to the clustering group.
        // Move the new marker to the map and select it.
        // Then register the new marker as the last selected marker.
        // Lastly, show the trails view.
        if (newMarkerSelected) {
          if (lastSelectedMarker) {
            moveMarkerToCluster(lastSelectedMarker);
            lastSelectedMarker.deselect();
          }
          moveMarkerToMap(newMarkerSelected);
          newMarkerSelected.select();
          lastSelectedMarker = newMarkerSelected;
          showView(TRAILS_VIEW);
        }
        // NOTE: This scenario occurs when the map is clicked.
        // If no new marker was selected and there is
        // a last selected marker, then move the last selected
        // marker to the cluster group and deselect it.
        // Also, set the last selected marker to null,
        // since there was no new marker clicked.
        // Lastly, show the map view.
        else if (lastSelectedMarker)
        {
          moveMarkerToCluster(lastSelectedMarker);
          lastSelectedMarker.deselect();
          lastSelectedMarker = null;
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
      });

      $scope.nextTrail = function () {
        var index  = $scope.selectedTrails.indexOf($scope.selectedTrail);
        if ( index >= $scope.selectedTrails.length-1 )
          index = -1;
        $scope.selectedTrail = $scope.selectedTrails[++index];
        setTimeout(setTrailViewOffset, 50);
      }

      $scope.previousTrail = function () {
        var index = $scope.selectedTrails.indexOf($scope.selectedTrail);
        if ( index <= 0 )
          index = $scope.selectedTrails.length;
        $scope.selectedTrail = $scope.selectedTrails[--index];
      }

      $scope.hasMoreTrails = function () {
        return ($scope.selectedTrails.length <= 1);
      }

      var _fullscreen = false; // whether the trail view is in fullscreen or not.
      function toggleTrailView() {
        (!_fullscreen) ? _fullscreenOn() : _fullscreenOff();
      }

      $scope.toggleTrailView = toggleTrailView;

      // Switch fullscreen off.
      function _fullscreenOff() {
        _fullscreen = false;
        trailViewElm.classList.remove('fullscreen');
        // when leaving fullscreen mode, make sure we scroll back to the top.
        trailAndTrailheadDataElm.scrollTop = 0;
        trailAndTrailheadDataElm.addEventListener('touchmove',_touchMoveHandler);
      }

      // Switch fullscreen on.
      function _fullscreenOn() {
        trailViewElm.classList.add('fullscreen');
        trailAndTrailheadDataElm.removeEventListener('touchmove',_touchMoveHandler);
        _fullscreen = true;
      }

      // Prevent scrolling when not in fullscreen mode.
      function _touchMoveHandler(evt) {
        evt.preventDefault();
      }

      // @return [Boolean] Whether trails view is fullscreen or not.
      function isFullscreen() {
        return _fullscreen;
      }

      $scope.isFullscreen = isFullscreen;

      function closeTrailView() {
        trailViewElm.classList.add('closed');
        if (_fullscreen) {
          trailViewElm.style.webkitTransition = 'top 1s';
          _fullscreenOff();
        }
        deselectTrailHead($scope.selectedTrailHead);
        trailViewElm.addEventListener( 'webkitTransitionEnd', _transitionFinished );
      }

      $scope.closeTrailView = closeTrailView;

      function _transitionFinished( evt ) {
        trailViewElm.removeEventListener( 'webkitTransitionEnd', _transitionFinished );
      }

      function setTrailViewOffset() {
        var trailHeaderHeight = trailDataHeaderElm.offsetHeight;
        var calcValue = '-webkit-calc(100% - '+String(FOOTER_HEIGHT+TRAIL_NAV_HEIGHT+trailHeaderHeight+20)+'px)';
        trailViewElm.style.top = calcValue;
        trailViewElm.style.webkitTransition = 'top 0.5s';
        trailViewElm.classList.remove('closed');
      };


      function distance(th) {
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
