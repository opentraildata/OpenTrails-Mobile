'use strict';

(function (ng) {

  //
  // UTILITIES
  //

  var utils = {
      
    numToRad: function () {
      return num * Math.PI / 180;                 
    },

    haversine: function (position1, position2) {
      var lat1 = position1.get('latitude'),
          lat2 = position2.get('latitude'),
          lng1 = position1.get('longitude'),
          lng2 = position2.get('longitude');

      var dLat = utils.numToRad(lat2 - lat1),
          dLng = utils.numToRad(lng2 - lng1);

      var a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(utils.numToRad(lat1)) * Math.cos(utils.numToRad(lat2)) * Math.pow(Math.sin(dLng / 2), 2),
          c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return (6372.8 * c) * 0.621371;
    },

    defaults: function(obj) {
      ng.forEach(Array.prototype.slice.call(arguments, 1), function(source) {
        if (source) {
          for (var prop in source) {
            if (obj[prop] === void 0) obj[prop] = source[prop];
          }
        }
      });
      return obj;
    },

    has: function (obj, key) {
      return hasOwnProperty.call(obj, key); 
    },

    without: function (obj, keys) {
      var result = {}; 
      for (var key in obj) {
        if (keys.indexOf(key) === -1) {
          result[key] = obj[key]
        }
      }
      return result;
    },

    map: function (arr, f) {
      var results = []; 

      ng.forEach(arr, function (item) {
        results.push(f(item));
      });

      return results;
    },

    keys: function (obj) {
      var keys = [];
      for (var key in obj) {
        keys.push(key);
      }
      return keys;
    },

    inherit: function(protoProps, staticProps) {
      var parent = this;
      var child;
      if (protoProps && utils.has(protoProps, 'constructor')) {
        child = protoProps.constructor;
      } else {
        child = function(){ return parent.apply(this, arguments); };
      }
      ng.extend(child, parent, staticProps);
      var Surrogate = function(){ this.constructor = child; };
      Surrogate.prototype = parent.prototype;
      child.prototype = new Surrogate;
      if (protoProps) ng.extend(child.prototype, protoProps);
      child.__super__ = parent.prototype;
      return child;
    }
  }

  //
  // QUERY MODEL
  //
  
  function Query () {
    this.initialize.apply(this, arguments);
  }

  Query.EVALUATORS = {
    "equals": function (lhs, rhs) {
      return lhs === rhs;
    },
    "doesNotEqual": function (lhs, rhs) {
      return lhs !== rhs;
    },
    "contains": function (lhs, rhs) {
      if ( ng.isString(lhs) && ng.isString(rhs) ) {
        lhs = lhs.toLowerCase();
        rhs = rhs.toLowerCase();
        return lhs.indexOf(rhs) !== -1
      } else {
        return false; 
      }
    },
    "doesNotContain": function (lhs, rhs) {
      if ( ng.isString(lhs) && ng.isString(rhs) ) {
        lhs = lhs.toLowerCase();
        rhs = rhs.toLowerCase();
        return lhs.indexOf(rhs) === -1
      } else {
        return false; 
      }
    },
    "includes": function (lhs, rhs) {
      if ( ng.isArray(lhs) ) {
        return lhs.indexOf(rhs) !== -1;
      } else {
        return false; 
      }
    },
    "doesNotInclude": function (lhs, rhs) {
      if ( ng.isArray(lhs) ) {
        return lhs.indexOf(rhs) === -1;
      } else {
        return false; 
      }
    },
    "in": function (lhs, rhs) {
      if ( ng.isArray(rhs) ) {
        return rhs.indexOf(lhs) !== -1
      }
    },
    "notIn": function (lhs, rhs) {
      if ( ng.isArray(rhs) ) {
        return rhs.indexOf(lhs) === -1
      }
    }
  }

  Query.findEvaluator = function (id) {
    return Query.EVALUATORS[id] || ng.noop;
  }

  Query.perform = function (record, param) {
    var evaluator = Query.findEvaluator(param.evaluator),
        lhs = record.get(param.key),
        rhs = param.value;

    return !!evaluator(lhs, rhs);
  }

  Query.prototype.initialize = function (collection) {
    this.setCollection(collection);
  }

  Query.prototype.setCollection = function (collection) {
    if (!ng.isArray(collection)) collection = [];
    this.collection = collection; 
  }

  Query.prototype.where = function (params) {
    var results = []; 

    if ( ng.isObject(params) ) params = [ params ];

    ng.forEach(this.collection, function (record) {
      ng.forEach(params, function (param) {
        if ( Query.perform(record, param) ) results.push(record);
      });
    });

    return new Query(results);
  }

  Query.prototype.find = function (params) {
    return this.where(params).first();
  }

  Query.prototype.sort = function (func) {
    return new Query(this.collection.sort(func));
  }

  Query.prototype.sortBy = function (attr, dir) {
    var ASC = 'ASC';
    var DESC = 'DESC';

    var results = this.collection.sort(function (a,b) {
      if (dir === ASC) {
        return a.get(attr) > b.get(attr);
      } else if (dir === DESC) {
        return a.get(attr) < b.get(attr);
      } else {
        return true; 
      }
    })

    return new Query(results);
  }

  Query.prototype.groupBy = function (attr) {
    var results = {}; 

    ng.forEach(this.collection, function (record) {
      var value;

      if ( ng.isString(obj) ) {
        value = record.get(obj) 
      } else if ( ng.isFunction(obj) ) {
        value = obj.call(record, record);
      } else {
        return false;
      }

      results[value] = results[value] || [];
      results[value].push(record);
    });

    return results;
  }

  Query.prototype.first = function () {
    return this.collection[0];
  }

  Query.prototype.last = function () {
    return this.collection[this.collection.length - 1];
  }

  Query.prototype.all = function () {
    return this.collection; 
  }

  Query.prototype.count = function () {
    return this.collection.length; 
  }

  Query.prototype.each = function (f) {
    return ng.forEach(this.collection, f);
  }

  Query.prototype.map = function (f) {
    return utils.map(this.collection, f);
  }

  //
  // MODEL DEFINITION
  //

  function Model (attrs) {
    this.attributes = {}
    if ( ng.isObject(attrs) ) {
      for (var key in this.defaults) {
        this.attributes[key] = attrs[key] || this.defaults[key];
      }
    } else {
      this.attributes = utils.defaults(this.attributes, this.defaults);
    }
    this.initialize.apply(this, arguments);
  }

  ng.extend(Model.prototype, {
    initialize: ng.noop,
    attributes: {},
    set: function (attrs) {
      for (var key in attrs) {
        if ( utils.has(this.defaults, key) ) this.attributes[key] = attrs[key];
      }
      return attrs;
    },
    get: function (attr) {
      return this.attributes[attr];
    },
  });

  Model.inherit = utils.inherit;

  //
  // ASSOCIATION MODEL
  //

  var Association = Model.inherit({

    defaults: {
      primary: null,
      foreign: null,
      scope: null
    },

    where: function () {
      return this.perform('where', arguments);
    },

    find: function () {
      return this.perform('find', arguments);
    },

    sort: function () {
      return this.perform('sort', arguments);
    },

    sortBy: function () {
      return this.perform('sortBy', arguments);
    },

    first: function () {
      return this.perform('first', arguments);
    },

    last: function () {
      return this.perform('last', arguments);
    },

    all: function () {
      return this.perform('all', arguments);
    },

    count: function () {
      return this.perform('count', arguments);
    },

    map: function () {
      return this.perform('map', arguments);
    },

    each: function () {
      return this.perform('each', arguments);
    },

    toQuery: function () {
     var foreign = this.get('foreign'),
         scope = this.get('scope');
      return foreign.where(scope);
    },

    perform: function (name, args) {
      var query = this.toQuery();
      return query[name].apply(query, args)
    }

  });

  //
  // TRAIL MODEL
  //

  var TRAIL_ATTRIBUTES = {
    "id": null,
    "name": null,
    "segmentIds": null,
    "descriptn": null,
    "partOf": null
  }

  var Trail = Model.inherit({

    defaults: TRAIL_ATTRIBUTES,

    initialize: function () {

      this.trailSegments = new Association({
        primary: this,
        foreign: TrailSegment.Query,
        scope: {
          key: 'id',
          evaluator: 'in',
          value: this.get('segmentIds')
        }
      });

      this.trailHeads = new Association({
        primary: this,
        foreign: TrailHead.Query,
        scope: {
          key: 'trailIds',
          evaluator: 'includes',
          value: this.get('id')
        }
      });

    },

    toGeoJSON: function () {
      var features = this.trailSegments.map(function (trailSegment) {
        return trailSegment.toGeoJSON(); 
      });
      return {
        "type": "FeatureCollection",
        "features": features
      }
    }

  });

  Trail.Query = new Query(Trail);

  Trail.load = function (data) {
    var results = [];

    if (data.trails) {
      ng.forEach(data.trails, function (trail) {
        results.push( new Trail(trail) );
      });
    }

    Trail.Query.setCollection(results);
  }

  //
  // TRAILHEAD MODEL
  //

  var TRAILHEAD_ATTRIBUTES = {
    "id": null,
    "name": null,
    "trailIds": null,
    "stewardId": null,
    "parkName": null,
    "address": null,
    "parking": null,
    "kiosk": null,
    "geometry": null
  }

  var TrailHead = Model.inherit({

    defaults: TRAILHEAD_ATTRIBUTES,

    initialize: function () {
      this.trails = new Association({
        primary: this,
        foreign: Trail.Query,
        scope: {
          key: 'id',
          evaluator: 'in',
          value: this.get('trailIds')
        }
      });

      this.stewards = new Association({
        primary: this,
        foreign: Steward.Query,
        scope: {
          key: 'id',
          evaluator: 'equals',
          value: this.get('stewardId')
        }
      });

    },

    distanceFrom: function (position) {
      return position.distanceFrom(this.toPosition());
    },

    getLat: function () {
      var geom = this.get('geometry');
      if (geom && geom.coordinates) return geom.coordinates[1];
    },

    getLng: function () {
      var geom = this.get('geometry');
      if (geom && geom.coordinates) return geom.coordinates[0];
    },

    toPosition: function () {
      return new Position({latitude: this.getLat(), longitude: this.getLng() });
    },

    toGeoJSON: function () {
      var properties = utils.without(this.attributes, ['geometry']);
      var geometry = this.get('geometry');

      return {
        "type": 'Feature',
        "properties": properties,
        "geometry": geometry
      } 
    }
  });

  TrailHead.Query = new Query();

  TrailHead.loaded = false;

  TrailHead.load = function (data) {
    var results = [];

    if (data.geojson && data.geojson.features) {
      ng.forEach(data.geojson.features, function (feature) {
        var attrs = ng.extend({}, feature.properties, { geometry: feature.geometry });
        if (attrs.type === 'TrailHead') {
          results.push( new TrailHead(attrs) );
        }
      });
    }

    TrailHead.Query.setCollection(results);
    TrailHead.loaded = true;
  }

  //
  // TRAILSEGMENT MODEL
  //


  var TRAILSEGMENT_ATTRIBUTES = {
    "id": null,
    "name": null,
    "stewardId": null,
    "highway": null,
    "motorVehicles": null,
    "foot": null,
    "bicycle": null,
    "horse": null,
    "ski": null,
    "wheelChair": null,
    "osmTags": null,
    "geometry": null
  }

  var TrailSegment = Model.inherit({

    defaults: TRAILSEGMENT_ATTRIBUTES,

    initialize: function () {
      this.trails = new Association({
        primary: this,
        foreign: Trail.Query,
        scope: {
          key: 'trailSegmentIds',
          evaluator: 'includes',
          value: this.get('id')
        }
      });
    },

    toGeoJSON: function () {
      var properties = utils.without(this.attributes, ['geometry']);
      var geometry = this.get('geometry');

      return {
        "type": 'Feature',
        "properties": properties,
        "geometry": geometry
      } 
    }

  });

  TrailSegment.Query = new Query();

  TrailSegment.loaded = false;

  TrailSegment.load = function (data) {
    var results = [];

    if (data.geojson && data.geojson.features) {
      ng.forEach(data.geojson.features, function (feature) {
        var attrs = ng.extend({}, feature.properties, { geometry: feature.geometry });
        if (attrs.type === 'TrailSegment') {
          results.push( new TrailSegment(attrs) );
        }
      });
    }

    TrailSegment.Query.setCollection(results);
    TrailSegment.loaded = true;
  }

  //
  // STEWARD MODEL
  //

  var STEWARD_ATTRIBUTES = {
    "id": null,
    "name": null,
    "url": null,
    "phone": null,
    "address": null
  }

  var Steward = Model.inherit({

    defaults: STEWARD_ATTRIBUTES,

    initialize: function () {
      this.trailHeads = new Association({
        primary: this,
        foreign: Steward.Query,
        scope: {
          key: 'stewardId',
          evaluator: 'equals',
          value: this.get('id')
        }
      });

      this.notifications = new Association({
        primary: this,
        foreign: Notification.Query,
        scope: {
          key: 'stewardId',
          evaluator: 'equals',
          value: this.get('id')
        }
      });
    }

  });

  Steward.Query = new Query();

  Steward.loaded = false;

  Steward.load = function (data) {
    var results = [];

    if (data.stewards) {
      ng.forEach(data.stewards, function (steward) {
        results.push( new Steward(steward) );
      });
    }

    Steward.Query.setCollection(results);
    Steward.loaded = true;
  }

  //
  // NOTIFICATION MODEL
  //

  var NOTIFICATION_ATTRIBUTES = {
    "id": null,
    "title": null,
    "body": null,
    "stewardId": null,
    "type": null,
    "createdAt": null,
    "read": false
  }

  var Notification = Model.inherit({
    defaults: NOTIFICATION_ATTRIBUTES,
    markAsRead: function () {
      this.set({ read: true });
      return this;
    },
    isRead: function () {
      return this.get('read')         
    }
  });

  Notification.Query = new Query();

  Notification.loaded = false;

  Notification.load = function (data) {
    var results = [];

    if (data.notifications) {
      ng.forEach(data.notifications, function (notification) {
        results.push( new Notification(notification) );
      });
    }

    Notification.Query.setCollection(results);
    Notification.loaded = true;
  }

  //
  // POSITION
  //

  var POSITION_ATTRIBUTES = {
    latitude: null,
    longitude: null
  }

  var Position = Model.inherit({
    defaults: POSITION_ATTRIBUTES,
    distanceFrom: function (position) {
      return utils.haversine(this, position);
    }
  });

  //
  // TRAILLAYER MODEL

  var TrailLayer = Model.inherit({
    defaults: {
      trail: null         
    },
    initialize: function () {
      var trail = this.get("trail");

      if (trail) {
        var geojson = trail.toGeoJSON();
      }

      this.layer = L.geoJson(geojson, this.options)
    },

    options: {
      style: {
        color: '#a3a3a3'
      }
    },

    addTo: function (map) {
      map.addLayer(this);
    }
  });

  //
  // MODULE DEFINITION
  //

  var module = ng.module('trails.services', [ ]);

  module.factory('TrailLayer', [

    function () {
      return TrailLayer; 
    } 

  ]);

  //
  // DB MODEL
  //

  module.factory('Models', [

    '$http',

    function ($http) {

      var Models = {
        "TrailHead": TrailHead,
        "Trail": Trail,
        "TrailSegment": TrailSegment,
        "Steward": Steward,
        "Notification": Notification
      }

      var reload = function (data) {
        for (var key in Models) {
          Models[key].load(data);
        }
      }

      $http.get('data/data.json').then(
        function (res) {
          reload(res.data);
        }
      );

      return Models;
    }

  ]);

  module.factory('Application', [

    'Map',
    'CurrentPosition',

    function (Map, CurrentPosition) {

      var Application = function () {
        this.initialize.apply(this, arguments) 
      } 

      Application.prototype.initialize = function () {
        this.map = new Map();
        this.currentPosition = new CurrentPosition();
      }

      return new Application();
    } 

  ]);

  module.factory('CurrentPosition', [

    function () {

      var CurrentPosition = Model.inherit({
        defaults: {
          latitude: null,
          longitude: null
        },

        initialize: function (attrs) {
          this.position = new Position({latitude: this.get('latitude'), longitude: this.get('longitude') });
          this.update();
        },

        update: function () {
          this.set({ latitude: 41.07792775176955, longitude: -81.54353141784668 });
        }
      })

      return CurrentPosition;
    }  

  ]);

  module.factory('Map', [

    'TileLayer',

    function (TileLayer) {

      var Map = function () {
        this.initialize.apply(this, arguments) 
      } 

      Map.prototype.DEFAULT_ZOOM  = 13;
      Map.prototype.DEFAULT_ORIGIN = [ 41.082020, -81.518506 ];

      Map.prototype.initialize = function () {
        this.map = L.map(this.el, this.options); 
        this.setView(this.DEFAULT_ORIGIN, this.DEFAULT_ZOOM);
        this.setTileLayer(TileLayer.DEFAULT);
      }

      Map.prototype.options = {
        "zoomControl": false
      }

      Map.prototype.el = 'map-container';

      Map.prototype.render = function (el) {
        this.map = L.map(this.el) 
      }

      Map.prototype.setView = function (origin,zoom) {
        this.map.setView(origin,zoom);
        return this;
      }

      Map.prototype.getZoom = function () {
        return this.map.getZoom();
      }

      Map.prototype.setTileLayer = function (id) {
        var layer = new Map.TileLayer(id);

        this.addLayer(layer);

        if (this.tileLayer) {
          this.removeLayer(this.tileLayer);
        }

        this.tileLayer = layer;

        return this;
      }

      Map.prototype.addLayer = function (layer) {
        this.map.addLayer(layer.layer);
        return this;
      }

      Map.prototype.removeLayer = function (layer) {
        this.map.removeLayer(layer.layer);
        return this;
      }

      Map.prototype.on = function (e, cb) {
        this.map.on(e, cb);
        return this;
      }

      Map.prototype.trigger = function (e) {
        this.map.fire(e);
        return this;
      }

      Map.TileLayer = TileLayer;

      return Map;
    } 
  ]);

  module.factory('TileLayer', [

    function () {
      
      var TileLayer = function () {
        this.initialize.apply(this, arguments);
      }

      TileLayer.DEFAULT = 'terrain';

      TileLayer.ALL_LAYERS = [
        { "id": 'terrain',
          "name": 'Terrain',
          "url": 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
        },
        {
          "id": 'satellite',
          "name": 'Satellite',
          "url": 'http://{s}.tiles.mapbox.com/v3/codeforamerica.map-j35lxf9d/{z}/{x}/{y}.png'
        }
      ];

      TileLayer.DEFAULT_OPTIONS = {
        "detectRetina": true
      }

      TileLayer.find = function (id) {
        var layer;

        ng.forEach(TileLayer.ALL_LAYERS, function (tl) {
          if (tl.id === id) layer = tl;
        });

        if (layer) {
          return layer;
        } else {
          throw 'Error: TileLayer not found';
        }
      }

      TileLayer.prototype.initialize = function (id, options) {
        options = options || {};

        for (var key in TileLayer.DEFAULT_OPTIONS) {
          options[key] = options[key] || TileLayer.DEFAULT_OPTIONS[key];
        }

        this.options = options;

        this.layer = L.tileLayer(TileLayer.find(id).url, this.options);
      }

      TileLayer.prototype.addTo = function (map) {
        map.addLayer(this);
        return this;
      }

      TileLayer.prototype.removeFrom = function (map) {
        map.removeLayer(this);
        return this;
      }

      return TileLayer;
    }
      
  ]);

})(angular);
