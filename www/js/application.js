// Map Configurations
var MIN_ZOOM = 12;
var MAX_ZOOM = 16;
var TILE_URL = 'http://a.tiles.mapbox.com/v3/codeforamerica.map-j35lxf9d/{z}/{x}/{y}.png';

// Device State
var DEVICE = {
  online: false,
  ready: false
}

// Global Event Listeners
document.addEventListener('online', onDeviceOnline, true);
document.addEventListener('offline', onDeviceOffline, true);
document.addEventListener('deviceready', onDeviceReady, false);

// Global Event Handlers
function onDeviceOnline () {
  DEVICE.online = true;
}

function onDeviceOffline () {
  DEVICE.online = false;
}

function onDeviceReady () {

  DEVICE.ready = true;

  window.APPLICATION = (function () {

    // *****************
    // Utils
    // *****************

    function noop () {}

    // *****************
    // Custom Events
    // *****************

    var filesystemloaded = new CustomEvent(
      'filesystemloaded', {
        detail: {
          message: 'Filesystem was loaded',
          time: new Date()
        },
        bubbles: true,
        cancelable: true
      }
    )


    // *****************
    // Application Model
    // *****************

    function App () {
      this.initialize.apply(this, arguments);
    }

    App.prototype = {

      modelName: 'Application',

      map: null,

      fileSystem: null,

      initialize: function () {
        this.logger = new Logger(this);

        this._bindEvents(); 

        this.fileSystem = new FS(
          _.bind(this._onFileSystemLoad, this),
          _.bind(this._onFileSystemLoadError, this)
        );

        this.map = new Map();

        if (DEVICE.online) {
          this.map.addLayer(new TileLayer(TILE_URL));
        } else {
          // Offline map
        }
      },

      downloadMap: function () {
        this.logger.notice('Map downloaded');
      },

      deleteMap: function () {
        this.logger.notice('Map deleted');
      },

      // Event Listeners

      _bindEvents: function () {
        var downloadEl = document.getElementById('download');
        var clearEl = document.getElementById('clear');

        downloadEl.addEventListener('click', _.bind(this._onDownloadClick, this));
        clearEl.addEventListener('click', _.bind(this._onClearClick, this));

        document.addEventListener('pause', _.bind(this._onPause, this));
        document.addEventListener('resume', _.bind(this._onResume, this));
        document.addEventListener('online', _.bind(this._onOnline, this));
        document.addEventListener('offline', _.bind(this._onOffline, this));
        document.addEventListener('backbutton', _.bind(this._onBackButton, this));
        document.addEventListener('menubutton', _.bind(this._onMenuButton, this));
        document.addEventListener('searchbutton', _.bind(this._onSearchButton, this));
      },

      // Event Handlers

      _onDownloadClick: function () {
        this._confirm(
          'Would you like to download this map?', _.bind(this.downloadMap, this), noop
        );
      },

      _onClearClick: function () {
        this._confirm(
          'Would you like to clear this map?', _.bind(this.deleteMap, this), noop
        )
      },

      _onFileSystemLoad: function (fs) {
        this.logger.notice('FileSystem Loaded');
        this.fileSystem = fs;
      },

      _onFileSystemLoadError: function (fs) {
        this._alert('Error: Failure accessing the filesystem!');
      },

      _onPause: function (e) {
        this.logger.notice('Paused');
      },

      _onResume: function (e) {
        this.logger.notice('Resumed');
      },

      _onOnline: function (e) {
        this.logger.notice('Online');
      },

      _onOffline: function (e) {
        this.logger.notice('Offline');
      },

      _onBackButton: function (e) {
        this.logger.notice('Back Button Pressed');
      },

      _onMenuButton: function (e) {
        this.logger.notice('Menu Button Pressed');
      },

      _onSearchButton: function (e) {
        this.logger.notice('Search Button Pressed');
      },

      // Notification Helpers

      _alert: function () {
        navigator.notification.alert.apply(this, arguments);
      },

      _confirm : function () {
        navigator.notification.confirm.apply(this, arguments);
      },

      _beep: function () {
        navigator.notification.beep.apply(this, arguments);
      },

      _vibrate: function () {
        navigator.notification.vibrate.apply(this, arguments);
      }
    }

    // *****************
    // Map Model
    // *****************

    function Map () {
      this.initialize.apply(this, arguments) 
    }

    Map.prototype = {
      el: 'map',

      zoom: 12,

      origin: [ 41.082020, -81.518506 ],

      defaults: {
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      },

      layers: [],

      initialize: function (options) {
        options = options || {}
        this.options = _.defaults(options, this.defaults) 
        this._map = L.map(this.el, this.options)
        this._map.setView(this.origin, this.zoom);
      },

      clear: function () {
        var that = this;

        _.each(this.layers, function (layer) {
          layer.redraw(); 
          that.removeLayer(layer);
        });

        return this;
      },

      addLayer: function (layer) {
        this.layers.push(layer);
        this._map.addLayer(layer._layer);

        return this;
      },

      removeLayer: function (layer) {
        var index = this.layers.indexOf(layer);

        if (index !== -1) {
          this.layers.splice(index, 1);
        }

        this.map.removeLayer(layer._layer);

        return this;
      },

      getCenter: function () {
        return this._map.getCenter();
      }
    }

    // *****************
    // TileLayer Model
    // *****************

    function TileLayer () {
      this.initialize.apply(this, arguments);
    }

    TileLayer.prototype = {
      defaults: {
        detectRetina: true,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM
      },

      initialize: function (url,options) {
        options = options || {} 
        this.url = url;
        this.options = _.defaults(options, this.defaults);
        this._layer = L.tileLayer(this.url, this.options);
      } 
    }

    // *****************
    // FileSystem Model
    // *****************

    function FS () {
      this.initialize.apply(this, arguments)
    }

    FS.prototype = {
      modelName: 'FS',

      initialize: function (onSuccess, onError) {
        this.logger = new Logger(this);

        this.onSuccess = onSuccess || noop;
        this.onError = onError || noop;

        this.fileSystem = null;

        window.requestFileSystem(
          LocalFileSystem.PERSISTENT,
          0,
          _.bind(this._onRequestSuccess, this),
          _.bind(this._onRequestError, this)
        );
      },

      _onRequestSuccess: function (fs) {
        this.fileSystem = fs; 
        this.onSuccess(this);
      },

      _onRequestError: function (err) {
        var msg = '';

        // Determine Error Type
        switch (err.code) {
          case window.FileError.QUOTA_EXCEEDED_ERR:
            msg = msg + 'QUOTA_EXCEEDED_ERR';
            break;
          case window.FileError.NOT_FOUND_ERR:
            msg = msg + 'NOT_FOUND_ERR';
            break;
          case window.FileError.SECURITY_ERR:
            msg = msg + 'SECURITY_ERR';
            break;
          case window.FileError.INVALID_MODIFICATION_ERR:
            msg = msg + 'INVALID_MODIFICATION_ERR';
            break;
          case window.FileError.INVALID_STATE_ERR:
            msg = msg + 'INVALID_STATE_ERR';
            break;
          default:
            msg = msg + 'UNKNOWN_ERR';
            break;
        };

        // Log Error Message
        this.logger.error(msg)

        // Alert User of Error
        this.onError(msg);
      }
    }

    // *****************
    // Logger Model
    // *****************

    function Logger () {
      this.initialize.apply(this, arguments)
    }

    Logger.prototype = {
      initialize: function (obj) {
        this.modelName = obj.modelName;
      },

      notice: function (msg) {
        this._log('Notice: ' + msg);
        return this;
      },

      alert: function (msg) {
        this._log('Alert: ' + msg);
        return this;
      },

      error: function (msg) {
        this._log('Error: ' + msg)
        return this;
      },

      _log: function (msg) {
        console.log(this.modelName + ' ' + msg);
      }
    }


    return new App();

  })();

}
