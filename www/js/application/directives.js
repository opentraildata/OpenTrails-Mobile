(function (ng) {
  'use strict';

  var module = ng.module('trails.directives', []);

  module.directive('distanceFromTrailhead', [

    'utils',

    function (utils) {

      return {
        "restrict": 'E',

        "scope": {
          "trailhead": "=",
          "position": "="
        },

        "controller": function ($scope) {
          var position = $scope.position;

          $scope.$watch('trailhead', function (value) {
            if (value) {
              $scope.distance = value.distanceFrom(position.get('latitude'), position.get('longitude'));
            }

          });

        },

        "template": "{{ distance.toFixed(2) }} mi away"
      };

    }

  ]);

})(angular);
