(function (ng) {

  //
  // UTILITIES
  //


  function Utils () { }

  Utils.prototype.numToRad = function (num) {
    return num * Math.PI / 180;
  }

  Utils.prototype.haversine = function (lat1, lng1, lat2, lng2) {
    var dLat = utils.numToRad(lat2 - lat1),
        dLng = utils.numToRad(lng2 - lng1);

    var a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(utils.numToRad(lat1)) * Math.cos(utils.numToRad(lat2)) * Math.pow(Math.sin(dLng / 2), 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return (6372.8 * c) * 0.621371;
  }

  Utils.prototype.defaults = function (obj) {
    ng.forEach(Array.prototype.slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  }

  Utils.prototype.compact = function (arr) {
    var results = [];
    ng.forEach(arr, function (item) {
      if (item !== null && item !== undefined) results.push(item);
    });
    return results;
  }

  Utils.prototype.unique = function (arr) {
    var results = [];
    ng.forEach(arr, function (item) {
      if (results.indexOf(item) === -1) results.push(item);
    });
    return results;
  }

  Utils.prototype.has = function (obj,key) {
    return hasOwnProperty.call(obj, key);
  }

  Utils.prototype.without = function (obj, keys) {
    var result = {};
    for (var key in obj) {
      if (keys.indexOf(key) === -1) {
        result[key] = obj[key]
      }
    }
    return result;
  }

  Utils.prototype.map = function (arr, f) {
    var results = [];

    ng.forEach(arr, function (item) {
      results.push(f(item));
    });

    return results;
  }

  Utils.prototype.keys = function (obj) {
    var keys = [];
    for (var key in obj) {
      keys.push(key);
    }
    return keys;
  }

  Utils.prototype.values = function (obj) {
    var values = [];
    for (var key in obj) {
      values.push(obj[key]);
    }
    return values;
  }

  Utils.prototype.inherit = function(protoProps, staticProps) {
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

  window.utils = new Utils();

})(angular)
