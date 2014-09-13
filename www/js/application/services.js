(function (ng) {
  'use strict';

  //
  // CONFIGURATION
  //

  var Configuration = {
    MIN_ZOOM_LEVEL: 4,
    MAX_ZOOM_LEVEL: 16,
    MAX_BOUNDS: [[41.838746, -82.276611],[40.456287,-81.035156]],
    DEFAULT_ZOOM_LEVEL: 13,
    DEFAULT_MAP_CENTER: [ 41.082020, -81.518506 ],
    TRAIL_DATA_ENDPOINT: "http://staging.outerspatial.com/api/v0/organizations/3885/opentrails/named_trails",
    TRAILHEAD_DATA_ENDPOINT: "http://staging.outerspatial.com/api/v0/organizations/3885/opentrails/trailheads",
    TRAILSEGMENT_DATA_ENDPOINT: "https://trailheadlabs-outerspatial-staging.s3.amazonaws.com/uploads/organization/trail_segments_file/3885/3885_trail_segments.geojson",
    STEWARD_DATA_ENDPOINT: "http://staging.outerspatial.com/api/v0/organizations/3885/opentrails/stewards",

    NOTIFICATION_DATA_ENDPOINT: "http://morning-peak-3686.herokuapp.com/notifications.json",
    PHOTO_DATA_ENDPOINT: "http://morning-peak-3686.herokuapp.com/photos.json",
    TERRAIN_MAP_TILE_ENDPOINT: "http://{s}.tiles.mapbox.com/v3/codeforamerica.map-j35lxf9d/{z}/{x}/{y}.png",
    SATELLITE_MAP_TILE_ENDPOINT: "https://{s}.tiles.mapbox.com/v3/codeforamerica.iad4p3a2{z}/{x}/{y}.png"
  };

  //
  // MODEL DEFINITION
  //

  function Model (attrs) {
    this.attributes = {};
    if ( ng.isObject(attrs) ) {
      for (var key in this.defaults) {
        if (this.defaults.hasOwnProperty(key))
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
        return lhs.indexOf(rhs) !== -1;
      } else {
        return false;
      }
    },
    "doesNotContain": function (lhs, rhs) {
      if ( ng.isString(lhs) && ng.isString(rhs) ) {
        lhs = lhs.toLowerCase();
        rhs = rhs.toLowerCase();
        return lhs.indexOf(rhs) === -1;
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
        return rhs.indexOf(lhs) !== -1;
      }
    },
    "notIn": function (lhs, rhs) {
      if ( ng.isArray(rhs) ) {
        return rhs.indexOf(lhs) === -1;
      }
    }
  };

  Query.findEvaluator = function (id) {
    return Query.EVALUATORS[id] || ng.noop;
  };

  Query.perform = function (record, param) {
    var evaluator = Query.findEvaluator(param.evaluator),
        lhs = record.get(param.key),
        rhs = param.value;

    return !!evaluator(lhs, rhs);
  };

  Query.prototype.initialize = function (collection) {
    this.setCollection(collection);
  };

  Query.prototype.setCollection = function (collection) {
    if (!ng.isArray(collection)) collection = [];
    this.collection = collection;
  };

  Query.prototype.where = function (params) {
    var results = [];

    if ( !ng.isArray(params) ) params = [ params ];

    ng.forEach(this.collection, function (record) {
      ng.forEach(params, function (param) {
        if ( Query.perform(record, param) ) results.push(record);
      });
    });

    return new Query(results);
  };

  Query.prototype.find = function (params) {
    return this.where(params).first();
  };

  Query.prototype.sort = function (func) {
    return new Query(this.collection.sort(func));
  };

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
    });

    return new Query(results);
  };

  Query.prototype.groupBy = function (obj) {
    var results = {};
    ng.forEach(this.collection, function (record) {
      var value;

      if ( ng.isString(obj) ) {
        value = record.get(obj);
      } else if ( ng.isFunction(obj) ) {
        value = obj.call(record, record);
      } else {
        return false;
      }

      results[value] = results[value] || [];
      results[value].push(record);
    });

    return results;
  };

  Query.prototype.first = function () {
    return this.collection[0];
  };

  Query.prototype.last = function () {
    return this.collection[this.collection.length - 1];
  };

  Query.prototype.all = function () {
    return this.collection;
  };

  Query.prototype.count = function () {
    return this.collection.length;
  };

  Query.prototype.each = function (f) {
    return ng.forEach(this.collection, f);
  };

  Query.prototype.map = function (f) {
    return utils.map(this.collection, f);
  };

  //
  // TRAILSEARCH
  //

  function TrailSearch () {
  }

  TrailSearch.perform = function (params) {
    var nameQuery = [];
    var descQuery = [];

    params = params || {};

    if (params.keywords) {
      nameQuery.push({ key: 'name', evaluator: 'contains', value: params.keywords });
      descQuery.push({ key: 'descriptn', evaluator: 'contains', value: params.keywords });
    }

    var trailheads = [];

    trailheads = trailheads.concat( TrailHead.query.where(nameQuery) );
    trailheads = trailheads.concat( TrailHead.query.where(descQuery) );

    var results = TrailHead.query.map(function (trailhead) {
      var trails;

      if (trailheads.indexOf(trailhead) === -1 &&
        (nameQuery.length > 0 || descQuery.length > 0)) {
        trails = [];
        trails = trails.concat( trailhead.trails.where(nameQuery).all() );
        trails = trails.concat( trailhead.trails.where(descQuery).all() );
        trails = utils.unique(trails);
      } else {
        trails = trailhead.trails.all();
      }

      if (params.filters) {
        var filteredTrails = [];
        ng.forEach(trails,function(trail){
          // Use bitwise AND operator to compare the currently toggled filters to
          // those in the trail. If trail values are within the filters' values,
          // there will be no change in the filters bitmap.
          if ((params.filters.filterBitmap & trail.filterBitmap()) === params.filters.filterBitmap)
            filteredTrails.push(trail);
        });
        trails = filteredTrails;
      }

      if (trails.length > 0) {
        return new SearchResult(trailhead, trails);
      }
    });

    results = utils.compact(results);

    if (params.position) {
      results = results.sort(function (a,b) {
        return a.distanceFrom(params.position) < b.distanceFrom(params.position);
      });
    }

    var uniqueTrails = [];
    var filteredResults  = [];

    ng.forEach(results, function (result) {
      var resultTrails = [];

      ng.forEach(result.trails, function (trail) {
        if (uniqueTrails.indexOf(trail) === -1) {
          uniqueTrails.push(trail);
          resultTrails.push(trail);
        }
      });

      if (resultTrails.length > 0) {
        result.trails = resultTrails;
        filteredResults.push(result);
      }
    });


    return filteredResults;
  };

  //
  // SEARCHRESULT MODEL
  //

  function SearchResult (trailhead, trails) {
    this.trailhead = trailhead;
    this.trails = trails;
  }

  SearchResult.prototype.distanceFrom = function (position) {
    var dist;

    if (this.trailhead) {
      dist = this.trailhead.distanceFrom(position.get('latitude'), position.get('longitude'));
    } else {
      dist = 0;
    }

    return dist;
  };

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
      return query[name].apply(query, args);
    }

  });

  //
  // TRAIL MODEL
  //

  var Trail = Model.inherit({

    defaults: {
      "id": null,
      "name": null,
      "segment_ids": null,
      "description": null,
      "part_of": null
    },

    initialize: function () {

      this.trailSegments = new Association({
        primary: this,
        foreign: TrailSegment,
        scope: {
          key: 'id',
          evaluator: 'in',
          value: this.get('segment_ids')
        }
      });

      this.photo = new Association({
        primary: this,
        foreign: Photo,
        scope: {
          key: 'trailId',
          evaluator: 'equals',
          value: this.get('id')
        }
      });
    },

    getLength: function () {
      var total = 0;
      this.trailSegments.each(function (ts) {
        total = total + ts.getLength();
      });
      return total;
    },

    canFoot: function () {
      var result = true;
      this.trailSegments.each(function (ts) {
        if ( !ts.canFoot() ) result = false;
      });
      return result;
    },

    canBicycle: function () {
      var result = true;
      this.trailSegments.each(function (ts) {
        if ( !ts.canBicycle() ) result = false;
      });
      return result;
    },

    canHorse: function () {
      var result = true;
      this.trailSegments.each(function (ts) {
        if ( !ts.canHorse() ) result = false;
      });
      return result;
    },

    canSki: function () {
      var result = true;
      this.trailSegments.each(function (ts) {
        if ( !ts.canSki() ) result = false;
      });
      return result;
    },

    canWheelChair: function () {
      var result = true;
      this.trailSegments.each(function (ts) {
        if ( !ts.canWheelChair() ) result = false;
      });
      return result;
    },

    _bitmap : null,

    filterBitmap : function () {
      if (!this._bitmap) {
        this._bitmap = this.canFoot()    ? this._bitmap |= 1 : this._bitmap;
        this._bitmap = this.canBicycle() ? this._bitmap |= 2 : this._bitmap;
        this._bitmap = this.canHorse()   ? this._bitmap |= 4 : this._bitmap;
        this._bitmap = this.canSki()     ? this._bitmap |= 8 : this._bitmap;
      }
      return this._bitmap;
    },

    toGeoJson: function () {
      var features = this.trailSegments.map(function (trailSegment) {
        return trailSegment.toGeoJson();
      });
      return {
        "type": "FeatureCollection",
        "features": features
      };
    }

  }, {

    query: new Query(),

    load: function (data) {
      var results = [];

      if (data) {
        ng.forEach(data, function (trail) {
          if (trail.segment_ids.length) {
            if(trail.outerspatial){
              trail.id = trail.outerspatial.id;
              trail.segment_ids = trail.outerspatial.segment_ids;
            }
            results.push( new Trail(trail) );
          }
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
      "segment_ids": null,
      "steward_id": null,      
      "address": null,
      "parking": null,
      "kiosk": null,
      "restroom": null,
      "geometry": null
    },

    initialize: function () {

      this.trailSegments = new Association({
        primary: this,
        foreign: TrailSegment,
        scope: {
          key: 'id',
          evaluator: 'in',
          value: this.get('segment_ids')
        }
      });

      this.stewards = new Association({
        primary: this,
        foreign: Steward,
        scope: {
          key: 'id',
          evaluator: 'in',
          value: this.get('steward_id')
        }
      });

    },

    hasWater: function () {
      return (this.get('water') || '').toLowerCase() !== 'n';
    },

    hasParking: function () {
      return (this.get('parking') || '').toLowerCase() !== 'n';
    },

    hasKiosk: function () {
      return (this.get('kiosk') || '').toLowerCase() !== 'n';
    },

    hasRestroom: function () {
      return (this.get('restroom') || '').toLowerCase() !== 'n';
    },

    distanceFrom: function (lat, lng) {
      return utils.haversine(this.getLat(), this.getLng(), lat, lng);
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
      };
    }
  }, {

    query: new Query(),

    load: function (data) {
      var results = [];

      if (data.features) {
        ng.forEach(data.features, function (feature) {
          feature.properties.geometry = feature.geometry;
          if(feature.properties.outerspatial){
            feature.properties.id = feature.properties.outerspatial.id;
            feature.properties.steward_id = feature.properties.outerspatial.steward_id;
            feature.properties.segment_ids = feature.properties.outerspatial.segment_ids;
          }
          results.push( new TrailHead( feature.properties ) );
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
      "steward_id": null,
      "highway": null,
      "motor_vehicles": null,
      "foot": null,
      "bicycle": null,
      "horse": null,
      "ski": null,
      "wheel_chair": null,
      "osm_tags": null,
      "geometry": null
    },

    initialize: function () {
      this.trails = new Association({
        primary: this,
        foreign: Trail,
        scope: {
          key: 'segment_ids',
          evaluator: 'includes',
          value: this.get('id')
        }
      });

      this.trailHeads = new Association({
        primary: this,
        foreign: TrailHead,
        scope: {
          key: 'segment_ids',
          evaluator: 'includes',
          value: this.get('id')
        }
      });

    },

    getLength: function () {
      var geom = this.get('geometry');

      function calc (obj, total) {

        for (var i = 0; i < obj.length; i++) {
          if ( ng.isArray(obj[i][0]) ) {
            total = calc(obj[i], total);
          } else {
            var j = i + 1;

            if (j === obj.length) break;

            var a = obj[i];
            var b = obj[j];
            var dist = utils.haversine(a[1], a[0], b[1], b[0]);

            total = total + dist;
          }
        }

        return total;
      }

      return calc(geom.coordinates, 0);
    },

    canFoot: function () {
      return (this.get('foot') || '').toLowerCase() !== 'n';
    },

    canBicycle: function () {
      return (this.get('bicycle') || '').toLowerCase() !== 'n';
    },

    canHorse: function () {
      return (this.get('horse') || '').toLowerCase() !== 'n';
    },

    canSki: function () {
      return (this.get('ski') || '').toLowerCase() !== 'n';
    },

    canWheelChair: function () {
      return (this.get('wheelchair') || '').toLowerCase() !== 'n';
    },

    toGeoJson: function () {
      var properties = utils.without(this.attributes, ['geometry']);
      var geometry = this.get('geometry');

      return {
        "type": 'Feature',
        "properties": properties,
        "geometry": geometry
      };
    }

  }, {

    query: new Query(),

    load: function (data) {
      var results = [];

      if (data.features) {

        ng.forEach(data.features, function (feature) {          
          if(feature.properties.outerspatial){
            feature.properties.id = feature.properties.outerspatial.id;
            feature.properties.steward_id = feature.properties.outerspatial.steward_id;            
          }

          feature.properties.geometry = feature.geometry;
          results.push( new TrailSegment(feature.properties) );
          
        });
      }

      this.query.setCollection(results);
      this.loaded = true;
    }

  });

  //
  // PHOTO MODEL
  //

  var Photo = Model.inherit({

    defaults: {
      "id": null,
      "trailId": null,
      "url": null
    },

    initialize: function () {

      this.trail = new Association({
        primary: this,
        foreign: Trail,
        scope: {
          key: 'id',
          evaluator: 'equals',
          value: this.get('trailId')
        }
      });

    }

  },
  {
    query: new Query(),

    load: function (data) {
      var results = [];

      if (data.photos) {
        ng.forEach(data.photos, function (photo) {
          results.push( new Photo(photo) );
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
          evaluator: 'includes',
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
      "read": false,
      "deleted": false
    },

    markAsRead: function () {
      this.set({ read: true });
      return this;
    },

    markAsUnread: function () {
      this.set({ read: false });
      return this;
    },

    isRead: function () {
      return this.get('read');
    },

    isUnread: function () {
      return !this.isRead();
    },

    markAsDeleted: function () {
      this.set({ deleted: true });
      return this;
    },

    markAsUndeleted: function () {
      this.set({ deleted: false });
      return this;
    },

    isDeleted: function () {
      return this.get('deleted');
    },

    isUndeleted: function () {
      return !this.isDeleted();
    },

    getCreatedAt: function () {
      // Return the creation date as a timestamp
      // so view can format it per https://docs.angularjs.org/api/ng/filter/date#example
      return new Date(this.get('createdAt')).getTime();
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
      return [this.get('latitude'),this.get('longitude')];
    }

  });

  //
  // GEOPOSITION MODEL
  //

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

  //
  // MAP MODEL
  //

  var Map = Model.inherit({

    DEFAULT_ZOOM: Configuration.DEFAULT_ZOOM_LEVEL,

    DEFAULT_CENTER: Configuration.DEFAULT_MAP_CENTER,

    defaults: {
      el: 'map-container',
      options: {
        "zoomControl": false,
        "minZoom": Configuration.MIN_ZOOM_LEVEL,
        "maxZoom": Configuration.MAX_ZOOM_LEVEL
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
    },

    fitBounds: function (bounds, options) {
      this.delegate.fitBounds(bounds, options);
      return this;
    }

  });

  //
  // MAPLAYER MODEL
  //

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
    },

    setOpacity: function (n) {
      this.delegate.setOpacity(n);
      return this;
    },

    getBounds: function () {
      return this.delegate.getBounds();
    }

  });

  //
  // MAPTILELAYER MODEL
  //

  var TILE_LAYERS = {
    "terrain": {
      name: "Terrain",
      url: Configuration.TERRAIN_MAP_TILE_ENDPOINT
    },
    "satellite": {
      name: "Satellite",
      url: Configuration.SATELLITE_MAP_TILE_ENDPOINT
    }
  };

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
      this.set({url: url});
      this.delegate.setUrl(url);
      return this;
    },

    getUrl: function () {
      return this.get('url');
    }

  });

  MapTileLayer.INDEX = TILE_LAYERS;

  //
  // MAPGEOJSONLAYER MODEL
  //

  var MapGeoJsonLayer = MapLayer.inherit({

    defaults: {
      geojson: null,
      options: {}
    },

    initialize: function () {
      this.delegate = L.geoJson(this.get('geojson'), this.get('options'));
    }

  });

  //
  // MAPMARKER MODEL
  //

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

  var MapMarkerClusterGroup = Model.inherit({

    defaults: {
      "maxClusterRadius": 30,
      "showCoverageOnHover": false,

      // This is a duplicate of the default icon
      // creation function, which is provided
      // here as a guide for updating the
      // cluster icon appearance in the future.
      // Note that there are three cluster icon
      // sets: marker-cluster-small, -medium, and -large.
      "iconCreateFunction": function(cluster) {
        var childCount = cluster.getChildCount();

        var c = ' marker-cluster-';
        if (childCount < 10) {
          c += 'small';
        } else if (childCount < 100) {
          c += 'medium';
        } else {
          c += 'large';
        }

        return new L.DivIcon({
            html: '<div><span>' + childCount + '</span></div>',
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)
          });
      }
    },

    initialize: function () {
      this.delegate = new L.MarkerClusterGroup(this.attributes);
    },

    removeLayer: function (layer) {
      this.delegate.removeLayer(layer.delegate);
      return this;
    },

    addLayer: function (layer) {
      this.delegate.addLayer(layer.delegate);
      return this;
    },

    addTo: function (map) {
      map.addLayer(this);
      return this;
    }

  });

  //
  // MAPCIRCLEMARKER MODEL
  //

  var MapCircleMarker = MapMarker.inherit({

    defaults: {
      position: null,
      options: {}
    },

    initialize: function () {
      this.delegate = L.circleMarker(this.get('position'), this.get('options'));
    }

  });

  //
  // MAPICON MODEL
  //

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

  //
  // MAPTRAILHEADMARKER MODEL
  //

  var MapTrailHeadMarker = MapMarker.inherit({

    selected: false,

    defaults: {
      position: null,
      record: null
    },

    initialize: function () {
      MapMarker.prototype.initialize.apply(this, arguments);
      this.setIcon(MapTrailHeadMarker.DeselectedIcon);
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
    iconSize: [ 34, 34 ]
  });

  MapTrailHeadMarker.SelectedIcon = new MapIcon({
    iconUrl: 'img/trailhead-marker-selected.png',
    iconRetinaUrl: 'img/trailhead-marker-selected@2x.png',
    iconSize: [ 48, 48 ],
    iconAnchor: [ 24, 24 ]
  });

  MapTrailHeadMarker.fromTrailHead = function (trailHead) {
    return new MapTrailHeadMarker({ position: trailHead.getLatLng(), record: trailHead });
  };

  //
  // MAPTRAILLAYER MODEL
  //

  var MapTrailLayer = MapGeoJsonLayer.inherit({

    selected: false,

    defaults: {
      geojson: null,
      options: {
        style: {
          color: "#e29c4a",
          opacity: 1
        },
        highlightStyle: {
          color: "#e2504a",
          opacity: 1
        },
        smoothFactor: 2
      },
      record: null
    },

    select: function () {
      this.selected = true;

      this.delegate.setStyle(this.get('options').highlightStyle);

      this.bringToFront();

      return this;
    },

    deselect: function () {
      this.selected = false;

      this.delegate.setStyle(this.get('options').style);

      this.bringToBack();

      return this;
    }

  });

  MapTrailLayer.fromTrail = function (trail) {
    return new MapTrailLayer({ geojson: trail.toGeoJson(), record: trail });
  };


  //
  // MODULE DEFINITION
  //

  var module = ng.module('trails.services', [ ]);

  module.factory('MapMarkerClusterGroup', [

    function () {
      return MapMarkerClusterGroup;
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

  module.factory('Map', [

    function () {
      return new Map();
    }

  ]);

  module.factory('GeoPosition', [

    function () {
      return new GeoPosition();
    }

  ]);

  module.factory('utils', [

    function () {
      return utils;
    }

  ]);

  module.factory('TrailSearch', [

    function () {
      return TrailSearch;
    }

  ]);

  //
  // DATA LOADER
  //

  module.factory('Models', [

    '$http',

    function ($http) {

      var HOST = "http://morning-peak-3686.herokuapp.com";

      var LOADABLE = [
        "TrailHead", "Trail", "TrailSegment", "Steward","Notification"
      ];

      var Models = {
        "TrailHead": TrailHead,
        "Trail": Trail,
        "TrailSegment": TrailSegment,
        "Steward": Steward,
        "Notification": Notification,
        "Photo": Photo
      };

      Models.loaded = function () {
        var loaded = true;

        for (var i = 0; i < LOADABLE.length; i++) {
          var model = LOADABLE[i];
          if (!Models[model].loaded) {
            loaded = false;
            break;
          }
        }

        return loaded;
      };

      function parseCSV(strData, strDelimiter) {
        strDelimiter = (strDelimiter || ",");
        var objPattern = new RegExp((
          "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
          "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi"
        );
        var arrData = [[]];
        var arrMatches = null;

        while (arrMatches = objPattern.exec(strData)) {
            var strMatchedDelimiter = arrMatches[1];
            if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
              arrData.push([]);
            }
            if (arrMatches[2]) {
              var strMatchedValue = arrMatches[2].replace(
              new RegExp("\"\"", "g"), "\"");
            } else {
              var strMatchedValue = arrMatches[3];
            }
            arrData[arrData.length - 1].push(strMatchedValue);
        }

        var objArray = [];
        for (var i = 1; i < arrData.length; i++) {
          objArray[i - 1] = {};
          for (var k = 0; k < arrData[0].length && k < arrData[i].length; k++) {
            var key = arrData[0][k];
            if (key == "segment_ids") {
              arrData[i][k] = arrData[i][k].split(";");
            }
            objArray[i - 1][key] = arrData[i][k]
          }
        }

        return objArray;
      }

      function loadModel (model, key, url) {
        // var data = window.localStorage.getItem(key);
        var data = false;
        if (data) {
          model.load( JSON.parse(data) );
        } else {
          $http.get(url).then(
            function (res) {
              data = res.data;
              if (key == "TrailData" || key == "StewardData") {
                data = parseCSV(data);
              }
              // window.localStorage.setItem(key, JSON.stringify(data) );
              model.load(data);
            }
          );
        }
      }

      loadModel(Trail, "TrailData", Configuration.TRAIL_DATA_ENDPOINT);
      loadModel(TrailHead, "TrailHeadData", Configuration.TRAILHEAD_DATA_ENDPOINT);
      loadModel(TrailSegment, "TrailSegmentData", Configuration.TRAILSEGMENT_DATA_ENDPOINT);
      loadModel(Steward, "StewardData", Configuration.STEWARD_DATA_ENDPOINT);
      loadModel(Notification, "NotificationData", Configuration.NOTIFICATION_DATA_ENDPOINT);
      loadModel(Photo, "PhotoData", Configuration.PHOTO_DATA_ENDPOINT);

      window.Trail = Trail;
      window.Photo = Photo;

      return Models;
    }

  ]);

})(angular);
