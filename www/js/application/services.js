'use strict';

(function (ng) {

  var module = ng.module('trails.services', [ ]);

  module.factory('Application', [

    'Map',

    function (Map) {

      var Application = function () {
        this.initialize.apply(this, arguments) 
      } 

      Application.prototype.initialize = function () {
      }

      return new Application();
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

      TileLayer.INDEX = {
        "terrain": {
          "name": 'Terrain',
          "id": 'terrain',
          "url": 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
        },
        "satellite": {
          "name": 'Satellite',
          "id": 'satellite',
          "url": 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
        }
      }

      TileLayer.DEFAULT_OPTIONS = {
        "detectRetina": true
      }

      TileLayer.prototype.initialize = function (type, options) {
        this.options = tileLayer.DEFAULT_OPTIONS;
        this.tileLayer = tileLayer.all[type];
        this.layer = L.tileLayer(this.tileLayer.url, this.options);
      }

      TileLayer.prototype.addTo = function (map) {
        this.layer.addTo(map);
      }

      return TileLayer;
    }
      
  ]);

  module.factory('TrailHead', [

    'Trail',

    function (Trail) {

      var MOCK_DATA = [
        { id: 1, name: "Trailhead A", description: "Blah blah blah", source: "Metro Parks", longitude: -81.574303390980859, latitude: 41.159071911239259, trailIds: [ 1, 2 ] },
        { id: 2, name: "Trailhead B", description: "Blah blah blah", source: "Metro Parks", longitude: -81.574303390980859, latitude: 41.159071911239259, trailIds: [ 3, 4, 5, 6 ] },
        { id: 3, name: "Trailhead C", description: "Blah blah blah", source: "Metro Parks", longitude: -81.574303390980859, latitude: 41.159071911239259, trailIds: [ 7, 8 ] },
        { id: 4, name: "Trailhead D", description: "Blah blah blah", source: "Metro Parks", longitude: -81.574303390980859, latitude: 41.159071911239259, trailIds: [ 7 ] }
      ];

      var TrailHead = function () {
        this.initialize.apply(this, arguments);
      }

      TrailHead.prototype.defaults = {
        id: null,
        name: null,
        description: null,
        source: null,
        latitude: null,
        longitude: null,
        trailIds: []
      }

      TrailHead.prototype.initialize = function (attributes) {
        attributes = attributes || {};

        this.attributes = {};

        for (var property in this.defaults) {
          this.attributes[property] = attributes[property] || this.defaults[property];
        }

        this.trails = [];

        var trailIds = this.attributes.trailIds;

        for (var i = 0; i < trailIds.length; i++) {
          this.trails.push(Trail.find(trailIds[i]));
        }
      }

      TrailHead.prototype.get = function (key) {
        return this.attributes[key];
      }

      TrailHead.prototype.set = function (obj) {
        for (var property in obj) {
          this.attributes[property] = obj[property];
        }
        return this;
      }

      TrailHead.search = function (keywords) {
        var results = [];

        if (keywords && keywords.length > 0) {
          keywords = keywords.toLowerCase(); 
          for (var i = 0; i < TrailHead.all.length; i++) {
            var result = TrailHead.all[i];
            var name = (result.get('name') || '').toLowerCase();
            if (name.indexOf(keywords) !== -1) results.push(result);
          }
        } else {
          results = [];
        }

        return results;
      }

      TrailHead.find = function (id) {
        for (var i = 0; i < TrailHead.all.length; i++) {
          var trailhead = TrailHead.all[i];
          if (trailhead.get('id') === id) return trail;
        }
        return null;
      }

      TrailHead.all = [];

      for (var i = 0; i < MOCK_DATA.length; i++) {
        TrailHead.all.push( new TrailHead(MOCK_DATA[i]) );
      }

      return TrailHead;
    } 

  ]);

  module.factory('Trail', [

    function () {

      var MOCK_DATA = [
        { id: 1, name: "Trail A", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 1 ] },
        { id: 2, name: "Trail B", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 1 ] },
        { id: 3, name: "Trail C", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 1 ] },
        { id: 4, name: "Trail D", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 2 ] },
        { id: 5, name: "Trail E", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 2 ] },
        { id: 6, name: "Trail F", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 2 ] },
        { id: 7, name: "Trail G", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 3 ] },
        { id: 8, name: "Trail H", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 3 ] },
        { id: 9, name: "Trail I", description: "Blah blah blah", steward: "Metro Parks", source: "Metro Parks", trailHeadIds: [ 3 ] }
      ];

      var Trail = function () {
        this.initialize.apply(this, arguments);
      }

      Trail.prototype.defaults = {
        id: null,
        name: null,
        description: null,
        source: null,
        steward: null,
      }

      Trail.prototype.initialize = function (attributes) {
        attributes = attributes || {};

        this.attributes = {};

        for (var property in this.defaults) {
          this.attributes[property] = attributes[property] || this.defaults[property];
        }
      }

      Trail.prototype.get = function (key) {
        return this.attributes[key];
      }

      Trail.prototype.set = function (obj) {
        for (var property in obj) {
          this.attributes[property] = obj[property];
        }
        return this;
      }

      Trail.search = function (keywords) {
        var results = [];

        if (keywords && keywords.length > 0) {
          keywords = keywords.toLowerCase(); 
          for (var i = 0; i < Trail.all.length; i++) {
            var result = Trail.all[i];
            var name = (result.get('name') || '').toLowerCase();
            if (name.indexOf(keywords) !== -1) results.push(result);
          }
        } else {
          results = [];
        }

        return results;
      }

      Trail.find = function (id) {
        for (var i = 0; i < Trail.all.length; i++) {
          var trail = Trail.all[i];
          if (trail.get('id') == id) return trail;
        }
        return null;
      }

      Trail.all = [];

      for (var i = 0; i < MOCK_DATA.length; i++) {
        Trail.all.push( new Trail(MOCK_DATA[i]) );
      }

      return Trail;
    } 

  ]);

  module.factory('AlertNotification', [
    function () {
      var MOCK_DATA = [
        { title: "Alert Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Alert Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Alert Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Alert Headline Body Copy Lorem Ipsum Lorem Trailhead." },
        { title: "Alert Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Alert Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Alert Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Alert Headline Body Copy Lorem Ipsum Lorem Trailhead." },
        { title: "Alert Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Alert Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Alert Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Alert Headline Body Copy Lorem Ipsum Lorem Trailhead." },
        { title: "Alert Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Alert Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Alert Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Alert Headline Body Copy Lorem Ipsum Lorem Trailhead." }
      ];

      var AlertNotification = function () {
        this.initialize.apply(this, arguments);
      }

      AlertNotification.prototype.defaults = {
        title: null,
        body: null,
        source: null,
        created_at: null
      }

      AlertNotification.prototype.initialize = function (attributes) {
         attributes = attributes || {};

        this.attributes = {};

        for (var property in this.defaults) {
          this.attributes[property] = attributes[property] || this.defaults[property];
        }
      }

      AlertNotification.prototype.get = function (key) {
        return this.attributes[key];
      }

      AlertNotification.prototype.set = function (obj) {
        for (var property in obj) {
          this.attributes[property] = obj[property];
        }
        return this;
      }

      AlertNotification.all = [];

      for (var i = 0; i < MOCK_DATA.length; i++) {
        AlertNotification.all.push( new AlertNotification(MOCK_DATA[i]) );
      }

      return AlertNotification;

    }
  ]);

  module.factory('EventNotification', [
    function () {

      var MOCK_DATA = [
        { title: "Event Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead." },
        { title: "Event Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead." },
        { title: "Event Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead." },
        { title: "Event Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead." },
        { title: "Event Headline Copy", created_at: "Saturday, October 21st at 1pm", source: "Metro Parks", body: "Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Assuming Headline Body Copy Lorem just mucking up the Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Body Copy Lorem Ipsum Lorem Trailhead Ipsum. Event Headline Body Copy Lorem Ipsum Lorem Trailhead." }
      ];

      var EventNotification = function () {
        this.initialize.apply(this, arguments);
      }

      EventNotification.prototype.defaults = {
        title: null,
        body: null,
        source: null,
        created_at: null
      }

      EventNotification.prototype.initialize = function (attributes) {
         attributes = attributes || {};

        this.attributes = {};

        for (var property in this.defaults) {
          this.attributes[property] = attributes[property] || this.defaults[property];
        }
      }

      EventNotification.prototype.get = function (key) {
        return this.attributes[key];
      }

      EventNotification.prototype.set = function (obj) {
        for (var property in obj) {
          this.attributes[property] = obj[property];
        }
        return this;
      }

      EventNotification.all = [];

      for (var i = 0; i < MOCK_DATA.length; i++) {
        EventNotification.all.push( new EventNotification(MOCK_DATA[i]) );
      }

      return EventNotification;

    }
  ]);

})(angular);
