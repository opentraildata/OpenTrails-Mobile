angular.module('trails.services').factory('TrailsCanvasLayer', [
  'MapTrailLayer',
  function(MapTrailLayer) {
    var pixelRatio = window.devicePixelRatio || 1;

    /**
     * TrailsCanvasLayer is a leaflet layer that can render a set of trails
     * as lines on canvas tiles (instead of as SVG). It also contains several
     * optimizations to try and make things a bit faster.
     *
     * TODO: This isn't quite there yet, but it would be sweet if the API
     * here took some cues from LayerGroup -- you could add & remove other
     * sublayers on this layer.
     **/
    var TrailsCanvasLayer = L.TileLayer.Canvas.extend({
      initialize: function(options) {
        var self = L.TileLayer.Canvas.prototype.initialize.apply(this, arguments);
        this.trailLayerModels = options.trails.map(MapTrailLayer.fromTrail);
        this.trailLayers = this.trailLayerModels.map(function(layer) {
          return layer.delegate;
        });
        this._filter = null;
        this.highlighted = null;
        return self;
      },

      /**
       * Limits what trails get drawn. Provide a function that returns
       * true or false for whether to render a trail.
       **/
      filter: function(predicate) {
        if (predicate != this._filter) {
          this._filter = predicate;
          this.redraw();
        }
      },

      /**
       * Highlight a particular trail (or null for no highlight).
       * The highlighted trail will be drawn in front of other trails and
       * with styling from its `highlightStyle` option.
       **/
      highlight: function(trail) {
        if (trail != this.highlighted) {
          this.highlighted = this.trailLayerModels.filter(function(layer) {
            return layer.get('record') === trail;
          })[0];
          if (this.highlighted) {
            this.highlighted = this.highlighted.delegate;
          }
          this.redraw();
        }
      },

      drawTile: function(canvas, tilePoint, zoom) {
        var pixelScale = Math.pow(0.5, 15 - zoom);

        // Calculate the pixel coordinates of the tile and the geographic
        // bounds of the tile. We use these to determine which trails overlap
        // this tile and should be drawn.
        var tileX = 256 * tilePoint.x;
        var tileY = 256 * tilePoint.y;
        var tileGeoBounds = new L.LatLngBounds(
          this._map.unproject(L.point(256 * (tilePoint.x - 0.25), 256 * (tilePoint.y + 1.25)), zoom),
          this._map.unproject(L.point(256 * (tilePoint.x + 1.25), 256 * (tilePoint.y - 0.25)), zoom)
        );

        var ctx = canvas.getContext('2d');

        // Scale the canvas if we're on a retina or hi-res display
        if (pixelRatio !== 1) {
          canvas.width = 256 * pixelRatio;
          canvas.height = 256 * pixelRatio;
          canvas.style.width = "256px";
          canvas.style.height = "256px";
          ctx.scale(pixelRatio, pixelRatio);
        }

        // Set drawing styles
        ctx.fillStyle = "#f00";
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#00f";
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        var highlight = null;
        ctx.lastStyle = null;
        this.trailLayers.forEach(function(trailLayer) {
          if ((this._filter ? this._filter(trailLayer) : true) &&
              layerBounds(trailLayer).intersects(tileGeoBounds)) {
            if (trailLayer === this.highlighted) {
              highlight = trailLayer;
              return;
            }

            this.drawTrail(ctx, pixelScale, tileX, tileY, trailLayer);
          }
        }, this);

        if (highlight) {
          this.drawTrail(ctx, pixelScale, tileX, tileY, highlight, highlight.options.highlightStyle);
        }
      },

      drawTrail: function(ctx, pixelScale, tileX, tileY, trailLayer, style) {
        style = style || trailLayer.options.style;

        // setting context styles turns out to be pretty expensive,
        // so avoid doing so if there's no change.
        if (style !== ctx.lastStyle) {
          ctx.strokeStyle = style.color || "#f00";
          ctx.globalAlpha = ('opacity' in style) ? style.opacity : 1;
          ctx.lineWidth = style.weight || 5;
          ctx.lastStyle = style;
        }

        trailLayer.eachLayer(function(geoLayer) {
          var lines = layerProjection(geoLayer, this._map);
          for (var j = 0, lenj = lines.length; j < lenj; j++) {
            var line = lines[j];
            ctx.beginPath();
            for (var i = 0, len = line.length; i < len; i++) {
              var pixel = line[i];
              if (i === 0) {
                ctx.moveTo(pixel.x * pixelScale - tileX, pixel.y * pixelScale - tileY);
              }
              else {
                ctx.lineTo(pixel.x * pixelScale - tileX, pixel.y * pixelScale - tileY);
              }
            }
            ctx.stroke();
            ctx.closePath();
          }
        }, this);
      },

      onAdd: function(map) {
        // We don't want to calculate *everything* right away, but after a
        // quick breather, we will (so future panning is speedy)
        var self = this;
        setTimeout(function() {
          self.trailLayers.forEach(function(layer) {
            TrailsCanvasLayer.processLayer(layer, map)
          });
        }, 2000);

        return L.TileLayer.Canvas.prototype.onAdd.apply(this, arguments);
      }
    });

    // Internal. Used to lazily retrieve and cache the bounds of a layer.
    function layerBounds(layer) {
      if (!layer.bounds) {
        layer.bounds = layer.getBounds();
      }
      return layer.bounds;
    }

    // Internal. Used to lazily retrieve and cache the projected, simplified
    // line coordinates for a layer.
    function layerProjection(layer, map) {
      if (!layer.simplified) {
        layer.simplified = layer.getLatLngs().map(function(line) {
          return L.LineUtil.simplify(line.map(function(coordinate) {
            return map.project(coordinate, 15);
          }), 2);
        });
      }
      return layer.simplified;
    }

    // Pre-calculate cached data like bounds and projection for a layer
    TrailsCanvasLayer.processLayer = function processLayer(layer, map) {
      layerBounds(layer);
      layer.eachLayer(function(geoLayer) {
        layerProjection(geoLayer, map);
      });
    };

    return TrailsCanvasLayer;
  }
]);
