'use strict';

(function (ng) {

  var module = ng.module('trails.services', [ ]);

  module.factory('TrailHead', [

    '$http',

    function ($http) {

      var PATH = "data/trail_heads.geojson";

      var TrailHead = function () {
        this.initialize.apply(this, arguments);
      }

      TrailHead.all = [];

      var req = $http.get(PATH);

      req.success(function (res) {
        var results = [];

        for (var i = 0; i < res.features.length; i++) {
          var feature = res.features[i];
          var result = TrailHead.fromFeature(feature);
          if (result) results.push(result);
        }

        TrailHead.all = results;
      });

      req.error(function (err) {
        console.log(err);
      });

      TrailHead.prototype.defaults = {
        name: null,
        source: null,
        trail1: null,
        trail2: null,
        trail3: null,
        latitude: null,
        longitude: null
      }

      TrailHead.prototype.initialize = function (attributes) {
        attributes = attributes || {};
        this.attributes = {};
        for (var property in this.defaults) {
          this.attributes[property] = attributes[property] || this.defaults[property];
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

      TrailHead.fromFeature = function (feature) {
        var attributes = {};

        if (feature.properties) {
          attributes.name = feature.properties.NAME;        
          attributes.source = feature.properties.SOURCE;
          attributes.trail1 = feature.properties.TRAIL1;
          attributes.trail2 = feature.properties.TRAIL2;
          attributes.trail3 = feature.properties.TRAIL3;
        }

        if (feature.geometry && feature.geometry.type == "Point") {
          attributes.latitude = feature.geometry.coordinates[1];
          attributes.longitude = feature.geometry.coordinates[0];
        }

        return new TrailHead(attributes);
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

      return TrailHead;
    } 

  ]);

  module.factory('Trail', [

    function () {

      var Trail = function () {
        this.initialize.apply(this, arguments);
      }

      Trail.prototype.initialize = function (attributes) {
       
      }

      Trail.search = function (keywords) {
      
      }

      Trail.all = function () {
      
      }

      return Trail;
    } 

  ]);

})(angular);
