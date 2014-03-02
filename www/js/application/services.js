'use strict';

(function (ng) {

  var module = ng.module('trails.services', [ ]);

  module.factory('TrailHead', [

    function () {

      var TrailHead = function () {
        this.initialize.apply(this, arguments);
      }

      TrailHead.prototype.initialize = function (attributes) {
       
      }

      TrailHead.search = function (keywords) {
      
      }

      TrailHead.all = function () {
      
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
