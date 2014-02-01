var MAP_ID = 'map';

var Map  = function () {
  this.initialize()
}

Map.prototype = {
  layers: [],
  initialize: function (options) {
    this.map = L.map(MAP_ID, options);
  },
  addLayer: function (layer) {
  },
  removeLayer: function (layer) {
  },
  reload: function () {
  }
}

mapUtils = function() {

var MAP, MAP_CONTROL, BASE_LAYERS = {};

function tilePath(fileSystem, mapID) {
    var rootDir = fileSystem.root.fullPath;
    if (rootDir[rootDir.length-1] != '/') { rootDir += '/'; }
    return rootDir + 'tiles/' + mapID + '/{z}/{x}/{y}.png';
}

function reloadMap(options) {
    /*
     * Clear layers and reset based
     * on current mapIDs
     */
     
    //handle options
    var clear = options['clear'] || false;
    var fileSystem = options['fileSystem'] || null;
    var mapboxIDs = options['mapIDs'] || null;
    
    if (!fileSystem) { navigator.notification.alert('Must specify fileSystem'); return; }

    if (!MAP) { //initialize map if first time
        MAP = L.map('map', {
            'minZoom': 12,
            'maxZoom': 16
        }).setView([38.255, -85.73], 12);
    }
    
    //clear out old layers
    for (mapID in BASE_LAYERS) {
        var lyr = BASE_LAYERS[mapID];
        lyr.redraw(); //clear tiles
        MAP.removeLayer(lyr);
    }

    BASE_LAYERS = {};
    
    if (clear) { return; } //job done if just clear
    
    if (mapboxIDs == null) { return; } //no ids
    
    //add a layer for each mapbox ID
    for (var i=0, l=mapboxIDs.length; i<l; i++) {
        var mapID = mapboxIDs[i];
        var lyr = L.tileLayer(
            tilePath(fileSystem, mapID), 
            {
	            minZoom: 3,
	            maxZoom: 17,
              detectRetina: true
            }
        );
        BASE_LAYERS[mapID] = lyr;
        lyr.addTo(MAP); 
    }

}

return {
  'reloadMap': reloadMap
};

}();
