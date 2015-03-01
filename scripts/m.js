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
    var SPEED = {
      NORMAL: 1500,
      FAST: 1000
    };
    var GAP = 10;
    var CLEAR_INC = 10;
    var AD_HEIGHT = 60;
    var INIT_SHADE_HEIGHT = 10;
    var MAX_SHADES = 11;
    var BG_HEIGHT = GAME_HEIGHT - AD_HEIGHT;
    var MAX_Y = BG_HEIGHT - SHADE_HEIGHT;

    this.init = function () {
      this.initVars();
      this.injectStylesheet();
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
      this.$livescore = $('.live-score');
      this.$hidden = $('.hidden');
      this.best = localStorage.getItem('best') || 0;
    };

    this.injectStylesheet = function () {
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = '.shade { height: ' + SHADE_HEIGHT + 'px; }';
      document.getElementsByTagName('head')[0].appendChild(style);
    };

    this.bindEvents = function () {
      var self = this;
      $('.lane').on('mousedown touchstart mouseup touchend', function (e) {
        self.moveTo($(e.target).data('lane'));
      });
      $(document).on('mousedown touchstart', function(e) {
        e.preventDefault();
      });
    };

    this.reset = function () {
      $('.shade').remove();
      this.$lanes.removeClass('active');
      this.$livescore.hide();
      this.$gametitle.hide();
      this.lanes = [[], [], [], []];
      this.shades = [0, 0, 0, 0, 0];
      this.curLane = 0;
      this.score = 0;
      this.updateScore(0);
      this.falling = false;
      this.theme = 1;
    };

    this.start = function () {
      // this.welcome();
      this.preBegin();
    };

    this.preBegin = function () {
      this.$gametitle.hide();
      this.$livescore.show();

      this.prepareShade();
      this.transformShade();
    };

    this.welcome = function () {
      var self = this;
      $('.lane-2').addClass('active fade');
      this.$gametitle.show().removeClass('out');

      this.createShade({lane: 0, color: 4, position: 0});
      this.createShade({lane: 1, color: 4, position: 0});
      this.createShade({lane: 2, color: 3, position: 0});
      this.createShade({lane: 3, color: 4, position: 0});
      this.createShade({lane: 2, color: 2, position: 1});
      this.createShade({lane: 2, color: 1, position: 2});
      this.createShade({lane: 2, color: 0, position: 3});

      var moving = this.createShade({lane: this.curLane, color: 0, position: 4, y: 0, class: 'welcome'});
      var y = this.getY(4);

      setTimeout(function () {
        moving.shade.on(ANIMATION_END_EVENTS, function() {
          moving.shade.off(ANIMATION_END_EVENTS);
          self.checkCombine(self.curLane, function () {
            $('.lane-2').removeClass('active');
            self.$gametitle.addClass('out');
            // FIXME: launch menu;
          });
        });
        moving.shade.css({
          'transform': 'translate3d(0, ' + y + 'px, 0)',
          '-webkit-transform': 'translate3d(0, ' + y + 'px, 0)'
        });
      }, 100);
    };

    this.prepareShade = function () {
      var color = this.randomColor();
      var lane = this.randomLane();

      this.$prepareShade = $('<div />')
        .addClass('shade prepare-1 color-' + color)
        .attr('data-lane', lane).attr('data-color', color)
        .css({
          'width': '100%',
          'height': INIT_SHADE_HEIGHT + 'px'
        });

      this.$game.append(this.$prepareShade);
    };

    this.transformShade = function () {
      var self = this;
      this.falling = false;
      this.curLane = this.$prepareShade.data('lane');
      this.$prepareShade.on(ANIMATION_END_EVENTS, function (event) {
        if (event.propertyName === 'width') {
          // height => SHADE_HEIGHT
          self.$prepareShade
            .removeClass('prepare-1').addClass('prepare-2')
            .css({'height': ''});
        } else if (event.propertyName === 'height') {
          self.$prepareShade
            .removeClass('prepare-2')
            .off(ANIMATION_END_EVENTS);
          self.$activeShade = self.$prepareShade;
          self.$prepareShade = null;
          self.fall();
        }
      });
      // width => 25%
      setTimeout(function () {
        self.$prepareShade
          .addClass('lane-' + self.curLane)
          .css({
            'width': '',
            'height': INIT_SHADE_HEIGHT + 'px'
          });
      }, 100);
    };

    this.fall = function () {
      var self = this,
          color = this.$activeShade.data('color');

      this.shades[color] ++;
      this.$activeShade.css({
        'transform': 'translate3d(0, ' + SPEED.NORMAL + 'px, 0)',
        '-webkit-transform': 'translate3d(0, ' + SPEED.NORMAL + 'px, 0)',
      });
      this.looping = true;
      this.falling = true;

      setTimeout(function () {
        self.prepareShade();
      }, 100);
      (function loop () {
        var len = self.lanes[self.curLane].length,
            y = self.$activeShade[0].getBoundingClientRect().top,
            max_y = self.getY(len);

        self.$hidden.text(y);
        if (max_y - y <= GAP) {
          self.looping = false;
        }
        if (self.looping) {
          window.requestAnimationFrame(loop);
        } else {
          self.lanes[self.curLane].push({shade: self.$activeShade, y: max_y});
          self.$activeShade.on(ANIMATION_END_EVENTS, function() {
            self.$activeShade.removeClass('landing').off(ANIMATION_END_EVENTS);
            self.updateScore(2);
            self.checkCombine(self.curLane, function () {
              self.afterCombine();
            });
          });

          self.$activeShade
            .addClass('landing')
            .css({
              'transform': 'translate3d(0, ' + max_y + 'px, 0)',
              '-webkit-transform': 'translate3d(0, ' + max_y + 'px, 0)'
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

    this.combine = function (lane, color, len, cb) {
      var self = this,
          height = SHADE_HEIGHT * 2 - 1,
          bottom = AD_HEIGHT + (len === 2 ? 0 : ((len - 2) * SHADE_HEIGHT - 1));
      this.$combinedShade = $('<div />')
        .addClass('shade-combine color-' + color + ' lane-' + lane)
        .css({
          height: height + 'px',
          bottom: bottom + 'px'
        }).on(ANIMATION_END_EVENTS, function() {
          self.$combinedShade.off(ANIMATION_END_EVENTS);
          self.updateScore(2 * (color + 1));
          self.replaceCombine(lane, color + 1, len);
          self.checkCombine(lane, cb);
        });

      this.$game.append(this.$combinedShade);

      setTimeout(function () {
        $('.del').remove();
        self.$combinedShade
          .removeClass('color-' + color)
          .addClass('color-' + (color + 1))
          .css({height: SHADE_HEIGHT + 'px'});
        }, 100);
    };

    this.replaceCombine = function (lane, color, len) {
      var max_y = this.getY(len - 2),
          newShade = $('<div />')
            .addClass('shade color-' + color + ' lane-' + lane)
            .attr('data-color', color)
            .css({
              'transform': 'translate3d(0, ' + max_y + 'px, 0)',
              '-webkit-transform': 'translate3d(0, ' + max_y + 'px, 0)',
            });
      this.$game.append(newShade);
      this.$combinedShade.remove();

      this.lanes[this.curLane].splice(len - 2, 2, {shade: newShade, y: max_y});
      this.shades[color - 1] -= 2;
      this.shades[color] ++;
    };

    this.afterCombine = function () {
      if (this.checkDeath()) {
        // FIXME: Death UI
      } else {
        this.transformShade();
      }
    };

    this.checkDeath = function () {
      if (this.lanes[0].length > MAX_SHADES || this.lanes[1].length > MAX_SHADES ||
        this.lanes[2].length > MAX_SHADES || this.lanes[3].length > MAX_SHADES) {
        return true;
      }
      return false;
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
              self.updateScore(4 * (color + 1));
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
                'transform': 'translate3d(0, ' + sc[j].y + 'px, 0)',
                '-webkit-transform': 'translate3d(0, ' + sc[j].y + 'px, 0)'
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
              'transform': 'translate3d(0, ' + (sc[j].y - CLEAR_INC) + 'px, 0)',
              '-webkit-transform': 'translate3d(0, ' + (sc[j].y - CLEAR_INC) + 'px, 0)'
            });
          }
          for (j = 0; j < 4; j++) {
            s[j].shade.css({
              'transition': 'height 0.15s ease',
              '-webkit-transition': 'height 0.15s ease',
              'transform': 'translate3d(0, 0 , 0)',
              '-webkit-transform': 'translate3d(0, 0, 0)',
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

    this.updateScore = function (inc) {
      this.score += inc;
      if (this.score > this.best) {
        this.best = this.score;
        localStorage.setItem('best', this.best);
      }
      this.$livescore.text(this.score);
    };

    this.createShade = function (options /* lane,color,position,y,class */) {
      var y = options.y !== void 0 ? options.y : this.getY(options.position);
      var shade = $('<div />')
          .addClass('shade lane-' + options.lane + ' color-' + options.color)
          .addClass(options.class)
          .attr('data-color', options.color)
          .css({
            'transform': 'translate3d(0, ' + y + 'px, 0)',
            '-webkit-transform': 'translate3d(0, ' + y + 'px, 0)',
          });
      var composite = {
        shade: shade,
        y: y
      };
      this.curLane = options.lane;
      this.shades[options.color] ++;
      this.lanes[options.lane][options.position] = composite;
      this.$game.append(shade);
      return composite;
    };

    this.randomColor = function () {
      return this._random(0, 1);
    };

    this.randomLane = function () {
      return this._random(0, 3);
    };

    this.moveTo = function (lane) {
      if (this.falling) {
        this.curLane = lane;
        this.$activeShade
          .removeClass('lane-0 lane-1 lane-2 lane-3')
          .addClass('lane-' + lane);
      }
    };

    this.getY = function (len) {
      return len === 0 ? MAX_Y : MAX_Y - len * SHADE_HEIGHT + 1;
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
