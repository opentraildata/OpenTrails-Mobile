(function (ng) {
  'use strict';

  //
  // CONFIGURATION
  //

  var LOCALHOST = "http://localhost:3000";
  var STAGING = "http://staging.outerspatial.com";
  var PRODUCTION = "http://www.outerspatial.com";
  var BASE_ENDPOINT = PRODUCTION + '/api/v0/applications/1';
  var Configuration = {
    MIN_ZOOM_LEVEL: 1,
    MAX_ZOOM_LEVEL: 18,
    MAX_BOUNDS: [[41.838746, -82.276611],[40.456287,-81.035156]],
    DEFAULT_ZOOM_LEVEL: 3,
    // Center of the United States
    DEFAULT_MAP_CENTER: [ 39.8282, -98.5795 ],
    // Ohio
    // DEFAULT_MAP_CENTER: [ 41.082020, -81.518506 ],
    // Boulder
    // DEFAULT_MAP_CENTER: [ 40.0293099,-105.2399774 ],
    TRAIL_DATA_ENDPOINT: BASE_ENDPOINT + '/cached_trails_csv',
    TRAILHEAD_DATA_ENDPOINT: BASE_ENDPOINT + "/cached_trailheads",
    TRAILSEGMENT_DATA_ENDPOINT: BASE_ENDPOINT + "/cached_trail_segments",
    STEWARD_DATA_ENDPOINT: BASE_ENDPOINT + "/cached_stewards_csv",
    NOTIFICATION_DATA_ENDPOINT: BASE_ENDPOINT + "/notifications?per_page=200",
    PHOTO_DATA_ENDPOINT: BASE_ENDPOINT + "/images?per_page=200",
    TERRAIN_MAP_TILE_ENDPOINT: "http://{s}.tiles.mapbox.com/v3/trailheadlabs.b9b3498e/{z}/{x}/{y}.png",
    SATELLITE_MAP_TILE_ENDPOINT: "https://{s}.tiles.mapbox.com/v3/trailheadlabs.jih1cig0/{z}/{x}/{y}.png",

    LEAFLET_ATTRIBUTION: '<a href="#" onclick="window.open(\'http://leafletjs.com\',\'_system\')">Leaflet</a>',
    OSM_ATTRIBUTION: '&copy; <a href="#" onclick="window.open(\'http://osm.org/copyright\',\'_system\')">OpenStreetMap</a> contributors'
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
    "intersects": function (lhs, rhs) {
      if ( ng.isArray(lhs) ) {
        return _.intersection(lhs,rhs).length !== 0;
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
        // trails = trailhead.trailSegments.all().map(function(trailSegment){
        //   trailSegment.trails.all();
        // });
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
        return a.distanceFrom(params.position) - b.distanceFrom(params.position);
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

      this.photos = new Association({
        primary: this,
        foreign: Photo,
        scope: {
          key: 'trail_ids',
          evaluator: 'includes',
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

    load: function (data,lastPage) {
      var results = this.query.collection || [];

      if (data) {
        ng.forEach(data, function (trail) {
          if(trail.outerspatial_id){
            trail.id = trail.outerspatial_id;
            trail.segment_ids = trail.outerspatial_segment_ids.split(';');
          } else {
            trail.segment_ids = trail.segment_ids.split(';')
          }
          if (trail.segment_ids.length) {
            results.push( new Trail(trail) );
          }
        });
      }

      this.query.setCollection(results);
      if(lastPage) {
        this.loaded = true;
      }
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

      this.trails = new Association({
        primary: this,
        foreign: Trail,
        scope: {
          key: 'segment_ids',
          evaluator: 'intersects',
          value: this.get('segment_ids')
        }
      });


      this.stewards = new Association({
        primary: this,
        foreign: Steward,
        scope: {
          key: 'id',
          evaluator: 'equals',
          value: this.get('steward_id')
        }
      });

    },

    hasWater: function () {
      return (this.get('water') || '').toLowerCase() === 'yes';
    },

    hasParking: function () {
      return (this.get('parking') || '').toLowerCase() === 'yes';
    },

    hasKiosk: function () {
      return (this.get('kiosk') || '').toLowerCase() === 'yes';
    },

    hasRestroom: function () {
      return (this.get('restroom') || '').toLowerCase() === 'yes';
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

    load: function (data,lastPage) {
      var results = this.query.collection || [];

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
      if(lastPage){
        this.loaded = true;
      }

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
      return (this.get('foot') || '').toLowerCase() === 'yes';
    },

    canBicycle: function () {
      return (this.get('bicycle') || '').toLowerCase() === 'yes';
    },

    canHorse: function () {
      return (this.get('horse') || '').toLowerCase() === 'yes';
    },

    canSki: function () {
      return (this.get('ski') || '').toLowerCase() === 'yes';
    },

    canWheelChair: function () {
      return (this.get('wheelchair') || '').toLowerCase() === 'yes';
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

    load: function (data,lastPage) {
      var results = this.query.collection || [];

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
      if(lastPage){
        this.loaded = true;
      }

    }

  });

  //
  // PHOTO MODEL
  //

  var Photo = Model.inherit({

    defaults: {
      "id": null,
      "trail_ids": null,
      "url": null
    },

    initialize: function () {

      this.trails = new Association({
        primary: this,
        foreign: Trail,
        scope: {
          key: 'id',
          evaluator: 'in',
          value: this.get('trail_ids')
        }
      });

    }

  },
  {
    query: new Query(),

    load: function (data,lastPage) {
      var results = this.query.collection || [];

      if (data.length) {
        ng.forEach(data, function (photo) {
          results.push( new Photo(photo) );
        });
      }

      this.query.setCollection(results);
      if(lastPage){
        this.loaded = true;
      }

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
        foreign: TrailHead,
        scope: {
          key: 'steward_id',
          evaluator: 'equals',
          value: this.get('id')
        }
      });

      this.notifications = new Association({
        primary: this,
        foreign: Notification,
        scope: {
          key: 'source_id',
          evaluator: 'equals',
          value: this.get('id')
        }
      });
    }

  }, {

    query: new Query(),

    load: function (data,lastPage) {
      var results = this.query.collection || [];

      if (data.length) {
        ng.forEach(data, function (steward) {
          if(steward.outerspatial_id){
            steward.id = steward.outerspatial_id;
          }
          results.push( new Steward(steward) );
        });
      }

      this.query.setCollection(results);
      if(lastPage){
        this.loaded = true;
      }

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
      "source_id": null,
      "level": null,
      "created_at": null,
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
      return new Date(this.get('created_at')).getTime();
    }

  }, {

    query: new Query(),

    load: function (data,lastPage) {
      var results = this.query.collection || [];

      if (data.length) {
        ng.forEach(data, function (notification) {
          notification.source_id = notification.source.id;
          results.push( new Notification(notification) );
        });
      }

      this.query.setCollection(results);
      if(lastPage){
        this.loaded = true;
      }

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
        "detectRetina": true,
        "minZoom": Configuration.MIN_ZOOM_LEVEL,
        "maxZoom": Configuration.MAX_ZOOM_LEVEL
      }
    },

    initialize: function () {
      this.delegate = L.map( this.get('el'), this.get('options') );
      this.delegate.attributionControl.setPrefix(Configuration.LEAFLET_ATTRIBUTION);
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
        "detectRetina": true,
        "attribution": Configuration.OSM_ATTRIBUTION
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

      function loadModel (model, key, url, page) {
        // var data = window.localStorage.getItem(key);
        var data = false;
        if (data) {
          model.load( JSON.parse(data) );
        } else {
          var pageUrl = url;
          if(page){
            pageUrl = url + "&page=" + page;
          }
          $http.get(pageUrl).then(
            function (res) {
              data = res.data;
              if (key == "TrailData" || key == "StewardData") {
                data = parseCSV(data);
              }
              // window.localStorage.setItem(key, JSON.stringify(data) );
              if(data.paging) {

                if(!data.paging.last_page) {
                  model.load(data.data,false);
                  var nextPage = data.paging.current_page+1;
                  loadModel(model,key,url,nextPage);
                } else {
                  model.load(data.data,true);
                }
              } else {
                model.load(data,true);
              }
            }
          );
        }
      }

      function parseCSV(data){
        return Papa.parse(data,{header:true}).data;
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
