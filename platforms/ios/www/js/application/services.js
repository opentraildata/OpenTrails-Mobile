'use strict';

(function (ng) {
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
      return foreign.query.where(scope);
    },

    perform: function (name, args) {
      var query = this.toQuery();
      return query[name].apply(query, args)
    }

  });

  //
  // TRAIL MODEL
  //

  var Trail = Model.inherit({

    defaults: {
      "id": null,
      "name": null,
      "segmentIds": null,
      "descriptn": null,
      "partOf": null
    },

    initialize: function () {

      this.trailSegments = new Association({
        primary: this,
        foreign: TrailSegment,
        scope: {
          key: 'id',
          evaluator: 'in',
          value: this.get('segmentIds')
        }
      });

      this.trailHeads = new Association({
        primary: this,
        foreign: TrailHead,
        scope: {
          key: 'trailIds',
          evaluator: 'includes',
          value: this.get('id')
        }
      });

    },

    toGeoJson: function () {
      var features = this.trailSegments.map(function (trailSegment) {
        return trailSegment.toGeoJson(); 
      });
      return {
        "type": "FeatureCollection",
        "features": features
      }
    }

  }, {

    query: new Query(),

    load: function (data) {
      var results = [];

      if (data.trails) {
        ng.forEach(data.trails, function (trail) {
          results.push( new Trail(trail) );
        });
      }

      this.query.setCollection(results);
      this.loaded = true;
    }
  
  });

  //
  // TRAILHEAD MODEL
  //

  var TrailHead = Model.inherit({

    defaults: {
      "id": null,
      "name": null,
      "trailIds": null,
      "stewardId": null,
      "parkName": null,
      "address": null,
      "parking": null,
      "kiosk": null,
      "geometry": null
    },

    initialize: function () {
      this.trails = new Association({
        primary: this,
        foreign: Trail,
        scope: {
          key: 'id',
          evaluator: 'in',
          value: this.get('trailIds')
        }
      });

      this.stewards = new Association({
        primary: this,
        foreign: Steward,
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

    getLatLng: function () {
      return [ this.getLat(), this.getLng() ];
    },

    toPosition: function () {
      return new Position({latitude: this.getLat(), longitude: this.getLng() });
    },

    toGeoJson: function () {
      var properties = utils.without(this.attributes, ['geometry']);
      var geometry = this.get('geometry');

      return {
        "type": 'Feature',
        "properties": properties,
        "geometry": geometry
      } 
    }
  }, {

    query: new Query(),

    load: function (data) {
      var results = [];

      if (data.geojson && data.geojson.features) {
        ng.forEach(data.geojson.features, function (feature) {
          var attrs = ng.extend({}, feature.properties, { geometry: feature.geometry });
          if (attrs.type === 'TrailHead') {
            results.push( new TrailHead(attrs) );
          }
        });
      }

      this.query.setCollection(results);
      this.loaded = true;
    }

  });

  //
  // TRAILSEGMENT MODEL
  //

  var TrailSegment = Model.inherit({

    defaults: {
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
    },

    initialize: function () {
      this.trails = new Association({
        primary: this,
        foreign: Trail,
        scope: {
          key: 'trailSegmentIds',
          evaluator: 'includes',
          value: this.get('id')
        }
      });
    },

    toGeoJson: function () {
      var properties = utils.without(this.attributes, ['geometry']);
      var geometry = this.get('geometry');

      return {
        "type": 'Feature',
        "properties": properties,
        "geometry": geometry
      } 
    }

  }, {

    query: new Query(),

    load: function (data) {
      var results = [];

      if (data.geojson && data.geojson.features) {
        ng.forEach(data.geojson.features, function (feature) {
          var attrs = ng.extend({}, feature.properties, { geometry: feature.geometry });
          if (attrs.type === 'TrailSegment') {
            results.push( new TrailSegment(attrs) );
          }
        });
      }

      this.query.setCollection(results);
      this.loaded = true;
    }

  });

  //
  // STEWARD MODEL
  //

  var Steward = Model.inherit({

    defaults: {
      "id": null,
      "name": null,
      "url": null,
      "phone": null,
      "address": null
    },

    initialize: function () {
      this.trailHeads = new Association({
        primary: this,
        foreign: Steward,
        scope: {
          key: 'stewardId',
          evaluator: 'equals',
          value: this.get('id')
        }
      });

      this.notifications = new Association({
        primary: this,
        foreign: Notification,
        scope: {
          key: 'stewardId',
          evaluator: 'equals',
          value: this.get('id')
        }
      });
    }

  }, {

    query: new Query(),

    load: function (data) {
      var results = [];

      if (data.stewards) {
        ng.forEach(data.stewards, function (steward) {
          results.push( new Steward(steward) );
        });
      }

      this.query.setCollection(results);
      this.loaded = true;
    }

  });

  //
  // NOTIFICATION MODEL
  //

  var Notification = Model.inherit({
    defaults: {
      "id": null,
      "title": null,
      "body": null,
      "stewardId": null,
      "type": null,
      "createdAt": null,
      "read": false
    },

    markAsRead: function () {
      this.set({ read: true });
      return this;
    },

    isRead: function () {
      return this.get('read')         
    }

  }, {

    query: new Query(),

    load: function (data) {
      var results = [];

      if (data.notifications) {
        ng.forEach(data.notifications, function (notification) {
          results.push( new Notification(notification) );
        });
      }

      this.query.setCollection(results);
      this.loaded = true;
    }
  
  });

  //
  // POSITION MODEL
  //

  var Position = Model.inherit({

    defaults: {
      latitude: null,
      longitude: null
    },

    distanceFrom: function (position) {
      return utils.haversine(this, position);
    },

    toArray: function () {
      return [this.get('latitude'),this.get('longitude')]          
    }

  });

  var GeoPosition = Model.inherit({

    defaults: {
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: null,
      longitude: null,
      speed: null
    },

    getLatLng: function () {
      return [ this.get('latitude'), this.get('longitude') ];
    }

  });

  var Map = Model.inherit({

    DEFAULT_ZOOM: 13,

    DEFAULT_CENTER: [ 41.082020, -81.518506 ],

    defaults: {
      el: 'map-container',
      options: {
        "zoomControl": false,
      }
    },

    initialize: function () {
      this.delegate = L.map( this.get('el'), this.get('options') );
    },

    setView: function (position, zoom) {
      this.delegate.setView(position, zoom);
      return this;
    },

    panTo: function (position) {
      this.delegate.panTo(position);
      return this;
    },

    getZoom: function () {
      return this.delegate.getZoom();          
    },

    getCenter: function () {
      return this.delegate.getCenter();
    },

    addLayer: function (layer) {
      this.delegate.addLayer(layer.delegate);
      return this;
    },

    removeLayer: function (layer) {
      this.delegate.removeLayer(layer.delegate);
      return this;
    },

    on: function (e, f) {
      this.delegate.on(e, f);
      return this;
    },

    off: function (e, f) {
      this.delegate.off(e, f);
      return this;
    },

    trigger: function (e) {
      this.delegate.trigger(e);
      return this;
    }

  });

  var MapLayer = Model.inherit({

    defaults: {
      options: {}           
    },

    initialize: function () {
      this.delegate = undefined;           
    },

    on: function (e,f) {
      this.delegate.on(e, f);
      return this;
    },

    off: function (e,f) {
      this.delegate.off(e, f);
      return this;
    },

    trigger: function (e) {
      this.delegate.trigger(e);
      return this;
    },

    bringToFront: function () {
      this.delegate.bringToFront();
      return this;
    },

    bringToBack: function () {
      this.delegate.bringToBack();
      return this;
    },

    addTo: function (map) {
      map.addLayer(this);
      return this;
    },

    removeFrom: function (map) {
      map.removeLayer(this);
      return this;
    }

  });


  var TILE_LAYERS = {
    "terrain": {
      name: "Terrain",
      url: "http://{s}.tile.osm.org/{z}/{x}/{y}.png"
    },
    "satellite": {
      name: "Satellite",
      url: "http://{s}.tiles.mapbox.com/v3/codeforamerica.map-j35lxf9d/{z}/{x}/{y}.png"
    }
  }

  var MapTileLayer = MapLayer.inherit({

    defaults: {
      url: TILE_LAYERS.terrain.url,
      options: {
        "detectRetina": true
      }
    },

    initialize: function () {
      this.delegate = L.tileLayer( this.get('url'), this.get('options') );
    },

    setUrl: function (url) {
      this.delegate.setUrl(url);
      return this;
    }

  });

  MapTileLayer.INDEX = TILE_LAYERS;

  var MapGeoJsonLayer = MapLayer.inherit({

    defaults: {
      geojson: null,
      options: {}
    },

    initialize: function () {
      this.delegate = L.geoJson(this.get('geojson'), this.get('options'));
    }
  
  });

  var MapTilesLayer = MapLayer.inherit({

    defaults: {
      urlTemplate: null,
      options: {
        "detectRetina": true
      }
    },

    initialize: function () {
      this.delegate = L.tileLayer(this.get('url'), this.get('options'));
    }

  });

  var MapMarker = MapLayer.inherit({

    defaults: {
      position: null,
      options: {}
    },

    initialize: function () {
      this.delegate = L.marker(this.get('position'), this.get('options'));
    },

    getPosition: function () {
      return this.delegate.getLatLng(); 
    },

    setPosition: function (position) {
      this.delegate.setLatLng(position);
      return this;
    },

    setIcon: function (icon) {
      this.delegate.setIcon(icon.delegate);
      return this;
    },

    remove: function () {
      this.delegate.remove();
      return this;
    }
  
  });

  var MapCircleMarker = MapMarker.inherit({

    defaults: {
      position: null,
      options: {}
    },

    initialize: function () {
      this.delegate = L.circleMarker(this.get('position'), this.get('options'))             
    } 

  });

  var MapIcon = Model.inherit({

    defaults: {
      iconUrl: null,
      iconRetinaUrl: null,
      iconSize: null,
      iconAnchor: null,
      popupAnchor: null,
      shadowUrl: null,
      shadowRetinaUrl: null,
      shadowSize: null,
      shadowAnchor: null
    },

    initialize: function () {
      this.delegate = L.icon(this.attributes);
    }
  
  });

  var MapTrailHeadMarker = MapMarker.inherit({

    selected: false,

    defaults: {
      position: null
    },

    toggle: function () {
      this.selected ? this.deselect() : this.select();
    },

    select: function () {
      this.selected = true;
      this.setIcon(MapTrailHeadMarker.SelectedIcon);
      return this;
    },

    deselect: function () {
      this.selected = false;
      this.setIcon(MapTrailHeadMarker.DeselectedIcon);
      return this;
    }

  });

  MapTrailHeadMarker.DeselectedIcon = new MapIcon({
    iconUrl: 'img/trailhead-marker-deselected.png',
    iconRetinaUrl: 'img/trailhead-marker-deselected@2x.png',
    iconSize: [ 30, 30 ]
  });

  MapTrailHeadMarker.SelectedIcon = new MapIcon({
    iconUrl: 'img/trailhead-marker-selected.png',
    iconRetinaUrl: 'img/trailhead-marker-selected@2x.png',
    iconSize: [ 35, 50 ],
    iconAnchor: [17,49]
  });

  MapTrailHeadMarker.fromTrailHead = function (trailHead) {
    return new MapTrailHeadMarker({ position: trailHead.getLatLng() }) 
  }

  var MapTrailLayer = MapGeoJsonLayer.inherit({

    defaults: {
      geojson: null,
      options: {
        style: {
          color: "#a3a3a3"
        } 
      }
    }

  });

  MapTrailLayer.fromTrail = function (trail) {
    return new MapTrailLayer({ geojson: trail.toGeoJson() }) 
  }

  var CollectionPresenter = function () {
    this.initialize.apply(this, arguments);
  }

  ng.extend(CollectionPresenter.prototype, {

    initialize: function (query) {
      this.query = query;            
      this.collection = [];
    }
  
  });

  CollectionPresenter.inherit = utils.inherit;

  var TrailHeadsPresenter = CollectionPresenter.inherit({

    selected: null,

    bindEvents: function () {
      var context = this;             

      ng.forEach(this.collection, function (marker) {
        marker.on('click', function (e) {
          context.select(marker);
        });
      });

      return this;
    },

    unbindEvents: function () {
      var context = this;             

      ng.forEach(this.collection, function (marker) {
        marker.off('click', function (e) {
          context.select(marker);
        });
      });

      return this;
    },

    render: function (map) {
      this.remove();

      if (this.query) {
        this.collection = this.query.map(function (th) {
          return MapTrailHeadMarker.fromTrailHead(th).deselect().addTo(map);
        });
      }

      this.bindEvents();

      return this;
    },

    remove: function () {
      this.unbindEvents();

      ng.forEach(this.collection, function (marker) {
        marker.remove(); 
      });
    },

    renderTo: function (map) {
      ng.forEach(this.collection, function (marker) {
        marker.deselect().addTo(map);
      });
    },

    select: function (marker) {
      if (this.selected === marker) {
        this.selected = null; 
        this.deselect(marker);
      } else {
        this.reset();
        this.selected = marker;
        marker.select(); 
      }

      return this;
    },

    deselect: function (marker) {
      marker.deselect();
      return this;
    },

    reset: function () {
      ng.forEach(this.collection, this.deselect);
      return this;
    }
  
  });

  var TrailsPresenter = CollectionPresenter.inherit({

    render: function (map) {
      this.remove();

      if (this.query) {
        this.collection = this.query.map(function (t) {
          return MapTrailLayer.fromTrail(t).addTo(map);
        });
      }

      return this;
    },

    remove: function () {
      ng.forEach(this.collection, function (layer) {
        layer.remove(); 
      })         
    }
 
  });


  //
  // MODULE DEFINITION
  //

  var module = ng.module('trails.services', [ ]);

  module.factory('Presenters', [

    function () {
      return {
        "Trails": TrailsPresenter,
        "TrailHeads": TrailHeadsPresenter
      }
    }    

  ]);

  module.factory('MapTileLayer', [
    function () {
      return MapTileLayer; 
    }  
  ]);

  module.factory('MapTrailLayer', [

    function () {
      return MapTrailLayer; 
    } 

  ]);

  module.factory('MapTrailHeadMarker', [

    function () {
      return MapTrailHeadMarker; 
    } 

  ]);

  module.factory('GeoPositionMarker', [

    function () {
      return MapCircleMarker; 
    } 

  ]);

  //
  // DB MODEL
  //

  module.factory('Models', [

    '$http',

    function ($http) {

      var LOADABLE = [
        "TrailHead", "Trail", "TrailSegment", "Steward", "Notification"
      ]

      var Models = {
        "TrailHead": TrailHead,
        "Trail": Trail,
        "TrailSegment": TrailSegment,
        "Steward": Steward,
        "Notification": Notification
      }

      Models.reload = function (data) {
        ng.forEach(LOADABLE, function (model) { Models[model].load(data) })
      }

      Models.loaded = function () {
        var loaded = true;
        ng.forEach(LOADABLE, function (model) { if (!Models[model].loaded) loaded = false });
        return loaded;
      }

      $http.get('data/output.json').then(
        function (res) {
          Models.reload(res.data);
        }
      );

      return Models;
    }

  ]);

  module.factory('Map', [

    function () {
      return new Map();
    } 

  ]);

  module.factory('MapCircleMarker', [

    function () {
      return MapCircleMarker; 
    }

  ]);

  module.factory('GeoPosition', [

    function () {
      return new GeoPosition(); 
    }
      
  ]);

})(angular);
