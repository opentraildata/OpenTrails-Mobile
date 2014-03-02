'use strict';

(function (ng) {

  var module = ng.module('trails.services', [ ]);

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

})(angular);
