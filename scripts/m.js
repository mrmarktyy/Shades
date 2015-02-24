(function() {
  'use strict';
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() {
          callback(currTime + timeToCall);
        },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
}());

$(function() {
  'use strict';

  function Game(options) {

    this.options = options || {};
    var GAME_DEFAULT_WIDTH = 320;
    var GAME_DEFAULT_HEIGHT = 480;
    var GAME_WIDTH = this.options.width || GAME_DEFAULT_WIDTH;
    var GAME_HEIGHT = this.options.height || GAME_DEFAULT_HEIGHT;
    var WIDTH_RATIO = GAME_WIDTH / GAME_DEFAULT_WIDTH;
    var HEIGHT_RATIO = GAME_HEIGHT / GAME_DEFAULT_HEIGHT;
    var BASE_SHADE_HEIGHT = 36;
    var ANIMATION_END_EVENTS = 'webkitTransitionEnd transitionend animationend webkitAnimationEnd';

    var SHADE_HEIGHT = Math.ceil(BASE_SHADE_HEIGHT * HEIGHT_RATIO);
    var INC = 3;
    var LOCK_Y = 10;
    var CLEAR_INC = 10;
    var AD_HEIGHT = 60;
    var INIT_SHADE_HEIGHT = 10;
    var BG_HEIGHT = GAME_HEIGHT - AD_HEIGHT;
    var MAX_Y = BG_HEIGHT - SHADE_HEIGHT;

    this.init = function () {
      this.initVars();
      this.bindEvents();
      this.reset();
    };

    this.initVars = function () {
      this.$game = $('#game').css({
        width: GAME_WIDTH + 'px',
        height: GAME_HEIGHT + 'px'
      });
      this.$bg = $('.bg').css({
        height: BG_HEIGHT + 'px'
      });
      this.$lanes = $('.lane').css({
        height: BG_HEIGHT + 'px'
      });
      this.$gametitle = $('.game-title');
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = '.shade { height: ' + SHADE_HEIGHT + 'px; }';
      document.getElementsByTagName('head')[0].appendChild(style);
    };

    this.bindEvents = function () {
      var self = this;
      $('.lane').on('mousedown touchstart mouseup touchend', function (event) {
        self.moveTo($(event.target).data('lane'));
      });
      $(document).on('mousedown touchstart', function(event) {
        event.preventDefault();
      });
    };

    this.welcome = function () {
      var self = this;
      $('.shade').remove();
      $('.lane-2').addClass('active fade');
      this.$gametitle.removeClass('out');
      this.curLane = 2;

      this.createShade(0, 4, 0);
      this.createShade(1, 4, 0);
      this.createShade(2, 3, 0);
      this.createShade(3, 4, 0);
      this.createShade(2, 2, 1);
      this.createShade(2, 1, 2);
      this.createShade(2, 0, 3);

      var lane = this.curLane;
      var color = 0;
      var position = 4;
      var x = this.getX(lane);
      var y = this.getY(position);
      var moving = {
        shade: $('<div />')
          .addClass('shade welcome color-' + color)
          .attr('data-color', color)
          .css({
            'transform': 'translate3d(' + x + 'px, 0, 0)',
            '-webkit-transform': 'translate3d(' + x + 'px, 0, 0)'
          }),
        x: x,
        y: y
      };
      this.$game.append(moving.shade);
      this.lanes[lane].push(moving);
      this.shades[lane] ++;

      setTimeout(function () {
        moving.shade.on(ANIMATION_END_EVENTS, function() {
          moving.shade.off(ANIMATION_END_EVENTS);
          self.checkCombine(self.curLane, function () {
            $('.lane-2').removeClass('active');
            self.$gametitle.addClass('out');
          });
        });
        moving.shade.css({
          'transform': 'translate3d(' + x + 'px, ' + y + 'px, 0)',
          '-webkit-transform': 'translate3d(' + x + 'px, ' + y + 'px, 0)'
        });
      }, 100);
    };

    this.reset = function () {
      this.lanes = [[], [], [], []];
      this.shades = [0, 0, 0, 0, 0];
      this.curLane = 1;
      this.theme = 1;
    };

    this.start = function () {
      this.welcome();
      // this.prepareShade();
      // this.transformShade();
    };

    this.prepareShade = function () {
      var color = this.randomColor();
      var lane = this.randomLane();

      this.$prepareShade = $('<div />')
        .addClass('shade prepare-1 color-' + color)
        .attr('data-lane', lane)
        .attr('data-color', color).css({
          'width': '100%',
          'height': INIT_SHADE_HEIGHT + 'px',
          'left': 0
        });

      this.$game.append(this.$prepareShade);
    };

    this.transformShade = function () {
      var self = this;
      var lane = this.$prepareShade.data('lane');
      this.$prepareShade.on(ANIMATION_END_EVENTS, function() {
        self.$prepareShade.on(ANIMATION_END_EVENTS, function () {
          self.$prepareShade.on(ANIMATION_END_EVENTS, function () {
            self.$prepareShade.off(ANIMATION_END_EVENTS);
            self.$prepareShade.removeClass('prepare-2');
            self.$activeShade = self.$prepareShade;
            self.fall();
          });
          // get ready
          var x = self.getX(lane);
          self.$prepareShade.css({
            'height': '',
            'left': '',
            'transform': 'translate3d(' + x + 'px, 0, 0)',
            '-webkit-transform': 'translate3d(' + x + 'px, 0, 0)'
          });
        });
        // height=>SHADE_HEIGHT
        self.$prepareShade.css({
          'width': '',
          'height': SHADE_HEIGHT
        }).removeClass('prepare-1').addClass('prepare-2');
      });
      // width=>25%
      setTimeout(function () {
        self.$prepareShade.css({
          'left': lane * 25 + '%',
          'width': '25%'
        });
      }, 100);
    };

    this.fall = function () {
      this.curLane = this.$activeShade.data('lane');
      this.shades[this.$activeShade.data('color')] ++;
      this.$activeShade.removeAttr('data-lane');
      this.locked = false;
      var y = 0;
      var self = this;
      setTimeout(function () {
        self.prepareShade();
      }, 1000);
      (function loop () {
        y += INC;
        var len = self.lanes[self.curLane].length,
            x = self.getX(self.curLane),
            max_y = self.getY(len);
        if (max_y - y <= LOCK_Y) {
          self.locked = true;
        }
        if (!self.locked) {
          window.requestAnimationFrame(loop);

          self.$activeShade.css({
            'transform': 'translate3d(' + x + 'px, ' + y + 'px, 0)',
            '-webkit-transform': 'translate3d(' + x + 'px, ' + y + 'px, 0)',
          });
        } else {
          self.lanes[self.curLane].push({shade: self.$activeShade, x: x, y: max_y});
          self.$activeShade.on(ANIMATION_END_EVENTS, function() {
            self.$activeShade.off(ANIMATION_END_EVENTS);
            self.checkCombine(self.curLane, function () {
              self.transformShade();
            });
          });

          self.$activeShade.css({
            'transform': 'translate3d(' + x + 'px, ' + max_y + 'px, 0)',
            '-webkit-transform': 'translate3d(' + x + 'px, ' + max_y + 'px, 0)'
          });
        }
      })();
    };

    this.checkCombine = function (lane, cb) {
      var shades = this.lanes[lane],
          len = shades.length;
      if (len >= 2) {
        var s1 = shades[len - 1].shade;
        var s2 = shades[len - 2].shade;
        var c1 = s1.data('color');
        var c2 = s2.data('color');
        if (c1 === c2 && c1 !== 4) {
          s1.addClass('del');
          s2.addClass('del');
          return this.combine(lane, c1, len, cb);
        }
      }
      var self = this;
      setTimeout(function () {
        self.checkClear(cb);
      }, 100);
    };

    this.combine = function (lane, c, len, cb) {
      var self = this,
          height = SHADE_HEIGHT * 2 - 1,
          bottom = AD_HEIGHT + (len === 2 ? 0 : ((len - 2) * SHADE_HEIGHT - 1));
      this.$combinedShade = $('<div />')
        .addClass('shade-combine color-' + c + ' lane-' + lane)
        .css({
          height: height + 'px',
          bottom: bottom + 'px'
        }).on(ANIMATION_END_EVENTS, function() {
          self.$combinedShade.off(ANIMATION_END_EVENTS);
          self.update(lane, c + 1, len);
          self.checkCombine(lane, cb);
        });

      this.$game.append(this.$combinedShade);

      setTimeout(function () {
        $('.del').remove();
        self.$combinedShade
          .removeClass('color-' + c)
          .addClass('color-' + (c + 1))
          .css({height: SHADE_HEIGHT + 'px'});
        }, 100);
    };

    this.checkClear = function (cb) {
      var self = this,
          min = Math.min(
        this.lanes[0].length,
        this.lanes[1].length,
        this.lanes[2].length,
        this.lanes[3].length),
          i, j, k, s, sc, color, iterator = 0;
      for (i = 0; i < min; i++) {
        s = [this.lanes[0][i], this.lanes[1][i], this.lanes[2][i], this.lanes[3][i]];
        if (s[0] && s[1] && s[2] && s[3] &&
          s[0].shade.data('color') === s[1].shade.data('color') &&
          s[0].shade.data('color') === s[2].shade.data('color') &&
          s[0].shade.data('color') === s[3].shade.data('color')) {
          color = s[0].shade.data('color');
          sc = [];
          for (k = 0; k < 4; k++) {
            for (j = i + 1; j < this.lanes[k].length; j++) {
              sc.push(this.lanes[k][j]);
              iterator ++;
            }
          }
          s[3].shade.on(ANIMATION_END_EVENTS, function() {
            s[3].shade.off(ANIMATION_END_EVENTS);
            s[3].shade.on(ANIMATION_END_EVENTS, function() {
              s[3].shade.off(ANIMATION_END_EVENTS);
              // clean up
              for (j = 0; j < sc.length; j++) {
                sc[j].shade.css({
                  'transition': '',
                  '-webkit-transition': '',
                  'transition-duration': '',
                  '-webkit-transition-duration': '',
                  'transition-timing-function': '',
                  '-webkit-transition-timing-function': ''
                });
              }
              for (j = 0; j < 4; j++) {
                s[j].shade.remove();
              }
              self.shades[color] -= 4;
              self.lanes[0].splice(i, 1);
              self.lanes[1].splice(i, 1);
              self.lanes[2].splice(i, 1);
              self.lanes[3].splice(i, 1);
              cb();
            });
            // go down
            for (j = 0; j < iterator; j++) {
              sc[j].y = sc[j].y + (SHADE_HEIGHT - 1);
              sc[j].shade.css({
                'transition-duration': '0.15s',
                '-webkit-transition-duration': '0.15s',
                'transform': 'translate3d(' + sc[j].x + 'px, ' + sc[j].y + 'px, 0)',
                '-webkit-transform': 'translate3d(' + sc[j].x + 'px, ' + sc[j].y + 'px, 0)'
              });
            }
            for (j = 0; j < 4; j++) {
              s[j].shade.css({
                'transition-duration': '0.15s',
                '-webkit-transition-duration': '0.15s',
                'height': 0
              });
            }
          });
          // go up
          for (j = 0; j < iterator; j++) {
            sc[j].shade.css({
              'transition-duration': '0.15s',
              '-webkit-transition-duration': '0.15s',
              'transition-timing-function': 'ease',
              '-webkit-transition-timing-function': 'ease',
              'transform': 'translate3d(' + sc[j].x + 'px, ' + (sc[j].y - CLEAR_INC) + 'px, 0)',
              '-webkit-transform': 'translate3d(' + sc[j].x + 'px, ' + (sc[j].y - CLEAR_INC) + 'px, 0)'
            });
          }
          for (j = 0; j < 4; j++) {
            s[j].shade.css({
              'transition': 'height 0.15s ease',
              '-webkit-transition': 'height 0.15s ease',
              'transform': 'translate3d(' + s[j].x + 'px, 0 , 0)',
              '-webkit-transform': 'translate3d(' + s[j].x + 'px, 0, 0)',
              'height': SHADE_HEIGHT + CLEAR_INC - 1 + 'px',
              'top': 'auto',
              'bottom': this.getBottom(i)
            });
          }
          return;
        }
      }
      cb();
    };

    this.update = function (lane, color, len) {
      var x = this.getX(lane),
          max_y = this.getY(len - 2),
          newShade = $('<div />')
            .addClass('shade color-' + color)
            .attr('data-color', color)
            .css({
              'transform': 'translate3d(' + x + 'px, ' + max_y + 'px, 0)',
              '-webkit-transform': 'translate3d(' + x + 'px, ' + max_y + 'px, 0)',
            });
      this.$game.append(newShade);
      this.$combinedShade.remove();

      this.lanes[this.curLane].splice(len - 2, 2, {shade: newShade, x: x, y: max_y});
      this.shades[color - 1] -= 2;
      this.shades[color] ++;
    };

    this.createShade = function (lane, color, position) {
      var x = this.getX(lane),
          y = this.getY(position),
          shade = $('<div />')
          .addClass('shade color-' + color)
          .attr('data-color', color)
          .css({
            'transform': 'translate3d(' + x + 'px, ' + y + 'px, 0)',
            '-webkit-transform': 'translate3d(' + x + 'px, ' + y + 'px, 0)',
          }), s;
      s = {
        shade: shade,
        x: x,
        y: y
      };
      this.shades[color] ++;
      this.lanes[lane][position] = s;
      this.$game.append(shade);
      return s;
    };

    this.randomColor = function () {
      return this._random(0, 1);
    };

    this.randomLane = function () {
      return this._random(0, 3);
    };

    this.moveTo = function (lane) {
      this.curLane = lane;
    };

    this.getY = function (len) {
      return len === 0 ? MAX_Y : MAX_Y - len * SHADE_HEIGHT + 1;
    };

    this.getX = function (lane) {
      return lane * (GAME_WIDTH / 4);
    };

    this.getBottom = function (len) {
      return AD_HEIGHT + (len === 0 ? 0 : (len * SHADE_HEIGHT - 1));
    };

    this._random = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    this.init();

    return this;
  }

  var viewportWidth = $(window).width();
  var viewportHeight = $(window).height();
  var options = {};
  if (viewportWidth < viewportHeight && viewportWidth < 500) {
    options.width = viewportWidth;
    options.height = viewportHeight;
  }

  window.game = new Game(options);
  window.game.start();

});
