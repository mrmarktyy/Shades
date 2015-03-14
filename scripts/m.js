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
    var MORE_URL = 'http://www.yoocc.com/';
    var SHADE_HEIGHT = Math.ceil(BASE_SHADE_HEIGHT * HEIGHT_RATIO);
    var IS_WECHAT = !!navigator.userAgent.match(/MicroMessenger/);
    var IS_ANDROID = navigator.userAgent.toLowerCase().indexOf('android') > -1;
    // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touchevents.js#L40
    var IS_TOUCH = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    var CLICK_EVENT = IS_TOUCH ? 'touchstart' : 'click';
    var SPEED = {
      LEVEL_INC: 300,
      NORMAL: 1500,
      FAST: 4000
    };
    var GAP = 10;
    var CLEAR_INC = 10;
    var AD_HEIGHT = 60;
    var PREPARE_SHADE_HEIGHT = 10;
    var MAX_SHADES = 11;
    var MAX_THEME = 5;
    var COUNT_DOWN = 3;
    var BG_HEIGHT = GAME_HEIGHT - AD_HEIGHT;
    var BTN_LARGE_HEIGHT = 100;
    var BTN_LARGE_DOWN_TOP = Math.round(BG_HEIGHT * 0.35);
    var BTN_LARGE_UP_TOP = BTN_LARGE_DOWN_TOP - BTN_LARGE_HEIGHT;
    var MAX_Y = BG_HEIGHT - SHADE_HEIGHT;
    var ALL_THEME_CLASS = '';
    var TITLE_DEFAULT = '';

    this.init = function () {
      this.initVars();
      this.injectStylesheet();
      this.bindEvents();
      this.reset();
    };

    this.initVars = function () {
      // var self = this;
      // this.enable = false;
      // $.ajax({
      //   dataType: 'json',
      //   url: '/config.json',
      //   success: function (data) {
      //     self.enable = data && data.enable;
      //   },
      //   error: function () {
      //     self.enable = false;
      //   }
      // });
      this.$game = $('#game').css({
        width: GAME_WIDTH + 'px',
        height: GAME_HEIGHT + 'px'
      });
      this.$bg = $('.bg').css({
        height: BG_HEIGHT + 'px'
      });
      this.$menu = $('.menu').css({
        height: BG_HEIGHT + 'px'
      });
      this.$tutorial = $('.tutorial').css({
        height: BG_HEIGHT + 'px'
      });
      this.$pause = $('.pause').css({
        height: BG_HEIGHT + 'px'
      });
      this.$lanes = $('.lane').css({
        height: BG_HEIGHT + 'px'
      });
      this.$title = $('title');
      TITLE_DEFAULT = this.$title.text();
      this.$lane2 = $('.lane-2');
      this.$share = $('.share');
      this.$gametitle = $('.game-title');
      this.$livescore = $('.live-score');
      this.$level = $('.level');
      this.$btnpause = $('.btn-pause');
      this.$countdown = $('.countdown');
      this.$score = $('.score span');
      this.$best = $('.best span');
      this.$ads = $('.ads');
      this.$ad = $('.ad').css({
        width: GAME_WIDTH + 'px'
      });
      this.$gameoverUp = $('.gameover-up').css({
        height: Math.ceil(GAME_HEIGHT / 2) + 'px'
      });
      this.$gameoverDown = $('.gameover-down').css({
        height: Math.floor(GAME_HEIGHT / 2) + 'px'
      });
      $('.btn-large.up').css({'top': BTN_LARGE_UP_TOP + 'px'});
      $('.btn-large.down').css({'top': BTN_LARGE_DOWN_TOP + 'px'});
      $('.btn-theme, .btn-tutorial').css({'top': (BTN_LARGE_DOWN_TOP + BTN_LARGE_HEIGHT + 20) + 'px'});
      $('.btn-home').css({'top': (BTN_LARGE_DOWN_TOP + BTN_LARGE_HEIGHT + 20) + 'px'});
      this.$hidden = $('.hidden');
      this.best = localStorage.getItem('shades-best') || 0;
      this.theme = localStorage.getItem('shades-theme') || 0;
      $('#wx_pic img').attr('src', 'images/theme' + this.theme + '.jpg');
      this.$best.text(this.best);
      for (var i = 0; i <= MAX_THEME; i++) {
        ALL_THEME_CLASS += 'theme-' + i + ' ';
      }
    };

    this.injectStylesheet = function () {
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = '.shade { height: ' + SHADE_HEIGHT + 'px; }';
      document.getElementsByTagName('head')[0].appendChild(style);
    };

    this.bindEvents = function () {
      var self = this;
      this.onLaneCick = function (e) {
        if (self.falling && !self.paused) {
          if (e.touches) {
            e = e.touches[0];
          }
          self.pressed = true;
          self.offsetY = e.offsetY || e.clientY;
          self.moveTo($(e.target).data('lane'));
        }
      };
      $('.lane').on('mousedown touchstart', this.onLaneCick);
      $('.lane').on('mousemove touchmove', function (e) {
        if (self.falling && self.pressed && !self.paused) {
          if (e.touches) {
            e = e.touches[0];
          }
          if ((e.offsetY || e.clientY) - self.offsetY > 50) {
            self.speedUp();
          }
        }
      });
      $('.lane').on('mouseup touchend', function () {
        self.pressed = false;
        self.offsetY = null;
      });
      $('.btn-begin').on(CLICK_EVENT, function () {
        self.begin();
      });
      $('.btn-playagain').on(CLICK_EVENT, function () {
        self.$gameoverUp.on(ANIMATION_END_EVENTS, function () {
          self.$gameoverUp.off(ANIMATION_END_EVENTS);
          self.reset();
          self.menu();
        });

        self.$gameoverUp.removeClass('in');
        self.$gameoverDown.removeClass('in');
      });
      $('.btn-theme').on(CLICK_EVENT, function () {
        self.updateTheme();
      });
      $('.btn-tutorial').on(CLICK_EVENT, function () {
        self.tmpBest = self.best;
        self.tutorial(1, '您的目标<br><br>用相同颜色的方块<br>组成一排。');
      });
      $('.btn-share').on(CLICK_EVENT, function(e) {
        self.$share.show();
        e.stopPropagation();
        $(document).on(CLICK_EVENT, '.overlay', function() {
          $(document).off(CLICK_EVENT, '.overlay');
          self.$share.hide();
        });
      });
      $('.btn-more').on(CLICK_EVENT, function (e) {
        e.stopPropagation();
        e.preventDefault();
        // FIXME: Change to APK url and Btn text if is Android
        if (IS_ANDROID) {

        }
        window.location.href = MORE_URL;
      });
      $('.btn-home').on(CLICK_EVENT, function (e) {
        e.stopPropagation();
        e.preventDefault();
        self.reset();
        self.welcome();
      });
      this.$btnpause.on(CLICK_EVENT, function (e) {
        e.stopPropagation();
        e.preventDefault();
        if (self.falling) {
          self.pause();
        }
      });
      $('.btn-continue').on(CLICK_EVENT, function (e) {
        e.stopPropagation();
        e.preventDefault();
        self.continue();
      });
      $(document).on('mousedown touchstart', function(e) {
        e.preventDefault();
      });
    };

    this.reset = function () {
      $('.shade').remove();
      this.$title.text(TITLE_DEFAULT);
      this.$lanes.removeClass('active');
      this.$menu.hide();
      this.$tutorial.hide();
      this.$pause.hide();
      this.$countdown.hide();
      this.$livescore.hide();
      this.$btnpause.hide();
      this.$level.hide();
      this.$gametitle.hide();
      this.$gameoverUp.hide();
      this.$gameoverDown.hide();
      $('.btn-continue .content').removeClass('in');
      this.lanes = [[], [], [], []];
      this.shades = [0, 0, 0, 0, 0];
      this.curLane = 0;
      this.score = 0;
      this.level = 1;
      this.falling = false;
      this.prepareReady = false;
      this.offsetY = null;
      this.paused = false;
      this.isTutorial = false;
      this.adfOff();

      if (this._random(1, 100) <= 40) {
        this.adf = true;
      }
    };

    this.start = function () {
      this.welcome();
    };

    this.begin = function () {
      var self = this;

      $('.btn-begin.up .content').on(ANIMATION_END_EVENTS, function () {
        $('.btn-begin.up .content').off(ANIMATION_END_EVENTS);
        self.$menu.hide();

        self.$livescore.show();
        self.$btnpause.show();
        self.$level.show();
        self.prepareShade();
        self.transformShade();
        self.adfOn();
      });

      this.score = 0;
      this.updateScore(0);
      $('.btn-begin .content').removeClass('in');
    };

    this.welcome = function () {
      var self = this;
      this.tmpBest = this.best;
      this.$game
          .removeClass(ALL_THEME_CLASS)
          .addClass('theme-0');
      this.$lane2.addClass('active fade');
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
            self.$gametitle.on(ANIMATION_END_EVENTS, function () {
              self.$gametitle.off(ANIMATION_END_EVENTS);
              // Revert theme and best
              self.$game
                .removeClass(ALL_THEME_CLASS)
                .addClass('theme-' + self.theme);
              if (self.best > self.tmpBest) {
                self.updateBest(self.tmpBest);
              }
              self.menu();
            });
            self.$lane2.removeClass('active');
            self.$gametitle.addClass('out');
          });
        });
        moving.shade.css({
          'transform': 'translate3d(0, ' + y + 'px, 0)',
          '-webkit-transform': 'translate3d(0, ' + y + 'px, 0)'
        });
      }, 500);
    };

    this.menu = function () {
      this.$menu.show();

      setTimeout(function () {
        $('.btn-begin .content').addClass('in');
      }, 100);
    };

    this.dead = function () {
      var self = this;
      this.$gameoverUp.show();
      this.$gameoverDown.show();

      if (IS_WECHAT) {
        this.$title.text(TITLE_DEFAULT + ': Duang Duang，我打到了关卡 ' + this.level + '并且获得了' + this.score + '分，谁敢来挑战我？');
      }

      setTimeout(function () {
        self.$gameoverUp.addClass('in');
        self.$gameoverDown.addClass('in');
      }, 100);
    };

    this.pause = function () {
      this.paused = true;
      var top = this.$activeShade[0].getBoundingClientRect().top;
      this.$activeShade.css({
        'transform': 'translate3d(0, ' + top + 'px, 0)',
        '-webkit-transform': 'translate3d(0, ' + top + 'px, 0)'
      });
      this.$btnpause.hide();
      this.$pause.show();
      $('.shade').addClass('blur');

      setTimeout(function () {
        $('.btn-continue .content').addClass('in');
      }, 100);
    };

    this.continue = function () {
      var self = this;

      $('.btn-continue.up .content').on(ANIMATION_END_EVENTS, function () {
        $('.btn-continue.up .content').off(ANIMATION_END_EVENTS);
        self.$pause.hide();
        self.countdown(COUNT_DOWN, function () {
          self.$btnpause.show();
          self.$countdown.hide();
          self.paused = false;
          $('.shade').removeClass('blur');
          self.fall({isContinue: true});
        });
      });

      $('.btn-continue .content').removeClass('in');
    };

    this.countdown = function (number, cb) {
      var self = this;
      this.$countdown.find('div').text(number);
      this.$countdown.on(ANIMATION_END_EVENTS, function () {
        self.$countdown
          .removeClass('ing')
          .off(ANIMATION_END_EVENTS);
        number --;
        if (number !== 0) {
          self.countdown(number, cb);
        } else {
          cb();
        }
      }).show();

      setTimeout(function () {
        self.$countdown.addClass('ing');
      }, 100);
    };

    this.tutorial = function (stage, text, btn) {
      var self = this;
      this.isTutorial = true;
      this.stage = stage;
      this.$menu.hide();
      $('.tutorial__success').hide();
      this.$tutorial.show();
      $('.tutorial .intro .text').html(text);
      $('.btn-begin .content').removeClass('in');
      $('.lane').off('mousedown touchstart', this.onLaneCick);

      $('.btn-next').text(btn || '尝试').on(CLICK_EVENT, function () {
        $('.btn-next').off(CLICK_EVENT);
        self['stage' + stage].call(self);
      });
    };

    this.stage1 = function () {
      var self = this;
      this.$tutorial.hide();
      this.$livescore.show();

      this.createShade({lane: 0, color: 0, position: 0});
      this.createShade({lane: 1, color: 0, position: 0});
      this.createShade({lane: 2, color: 0, position: 0});

      this.prepareShade({color: 0, lane: 1});
      this.transformShade({stop: 50,
        cb: function () {
          $('.tutorial__text')
            .html('<p>组成一排</p><p>触摸屏幕移动方块到正确的行列。</p>')
            .show();
          $('.spot').css({'left': '80%'}).show();
          $('.lane-3, .spot').on(CLICK_EVENT, function () {
            $('.lane-3, .spot').off(CLICK_EVENT);
            $('.tutorial__text').hide();
            $('.spot').hide();
            self.moveTo(3);
            self.fall({isContinue: true, top: 50});
          });
        }
      });
    };

    this.stage2 = function () {
      var self = this;
      this.$tutorial.hide();
      this.$livescore.show();

      this.createShade({lane: 0, color: 0, position: 0});
      this.createShade({lane: 1, color: 1, position: 0});
      this.createShade({lane: 2, color: 1, position: 0});
      this.createShade({lane: 3, color: 1, position: 0});

      this.prepareShade({color: 0, lane: 2});
      this.transformShade({stop: 50,
        cb: function () {
          $('.tutorial__text')
            .html('<p>合并2种颜色</p><p>触摸屏幕移动方块到正确的行列。</p>')
            .show();
          $('.spot').css({'left': '5%'}).show();
          $('.lane-0, .spot').on(CLICK_EVENT, function () {
            $('.lane-0, .spot').off(CLICK_EVENT);
            $('.tutorial__text').hide();
            $('.spot').hide();
            self.moveTo(0);
            self.fall({isContinue: true, top: 50});
          });
        }
      });
    };

    this.stage3 = function () {
      this.isTutorial = false;
      $('.lane').on('mousedown touchstart', this.onLaneCick);
      this.$tutorial.hide();
      if (this.best > this.tmpBest) {
        this.updateBest(this.tmpBest);
      }
      this.menu();
    };

    this.tutorialCallback = function () {
      var self = this, html, btn;
      $('.tutorial__success').show();
      if (this.stage === 1) {
        html = '提示<br><br>堆叠相同颜色<br>的方块以组成<br>更深的颜色。';
      } else if (this.stage === 2) {
        html = '提示<br><br>向下滑动<br>使方块下降速度更快。<br>教程完成！';
        btn = '完成';
      }
      setTimeout(function () {
        self.reset();
        self.tutorial(self.stage + 1, html, btn);
      }, 1500);
    };

    this.prepareShade = function (options) {
      options = options || {};
      var self = this;
      var color = options.color === undefined ? this.randomColor(): options.color;
      var lane = options.lane === undefined ? this.randomLane() : options.lane;

      this.prepareReady = false;
      this.$prepareShade = $('<div />')
        .addClass('shade prepare-0 bg-' + color)
        .attr('data-lane', lane).attr('data-color', color)
        .css({
          'width': '100%',
          'height': PREPARE_SHADE_HEIGHT + 'px'
        });

      this.$game.append(this.$prepareShade);
      // this.$prepareShade.hide().show();  // Potential hack to force reflow

      this.$prepareShade.on(ANIMATION_END_EVENTS, function () {
        self.$prepareShade
          .removeClass('prepare-0').addClass('prepare-1')
          .off(ANIMATION_END_EVENTS);
        self.prepareReady = true;
      });
      setTimeout(function () {
        self.$prepareShade.css({'opacity': 1});
      }, 100);
    };

    this.transformShade = function (options) {
      var self = this;
      if (!this.prepareReady) {
        setTimeout(function () {
          self.transformShade(options);
        }, 50);
        return;
      }
      this.curLane = this.$prepareShade.data('lane');
      this.$prepareShade.on(ANIMATION_END_EVENTS, function (event) {
        if (event.propertyName === 'width') {
          // height => SHADE_HEIGHT
          self.$prepareShade
            .removeClass('prepare-1').addClass('prepare-2')
            .css({'height': ''});
        } else if (event.propertyName === 'height') {
          // fall
          self.$prepareShade
            .removeClass('prepare-2')
            .off(ANIMATION_END_EVENTS);
          self.$activeShade = self.$prepareShade;
          self.$prepareShade = null;
          self.fall(options);
        }
      });
      // width => 25%
      setTimeout(function () {
        self.$prepareShade
          .addClass('lane-' + self.curLane)
          .css({
            'width': '',
            'height': PREPARE_SHADE_HEIGHT + 'px'
          });
      }, 100);
    };

    this.fall = function (options) {
      options = options || {};
      var self = this;
      var speed;
      if (options.isContinue) {
        var top = options.top || this.$activeShade[0].getBoundingClientRect().top;
        speed = top + SPEED.NORMAL + (this.level - 1) * SPEED.LEVEL_INC;
        this.$activeShade.css({
          'transform': 'translate3d(0, ' + speed + 'px, 0)',
          '-webkit-transform': 'translate3d(0, ' + speed + 'px, 0)'
        });
        loop();
        return;
      }

      speed = SPEED.NORMAL + (this.level - 1) * SPEED.LEVEL_INC;
      this.shades[this.$activeShade.data('color')] ++;
      this.$activeShade.css({
        'transform': 'translate3d(0, ' + speed + 'px, 0)',
        '-webkit-transform': 'translate3d(0, ' + speed + 'px, 0)'
      });
      this.looping = true;
      this.falling = true;

      setTimeout(function () {
        self.prepareShade();
      }, 100);
      loop();
      function loop () {
        var len = self.lanes[self.curLane].length,
            max_y = self.getY(len);

        self.y = self.$activeShade[0].getBoundingClientRect().top;
        self.$hidden.text(self.y);
        if (max_y - self.y <= GAP) {
          self.looping = false;
        }
        if (self.looping) {
          if (options.stop && self.y > options.stop) {
            self.$activeShade.css({
              'transform': 'translate3d(0, ' + self.y + 'px, 0)',
              '-webkit-transform': 'translate3d(0, ' + self.y + 'px, 0)'
            });
            if (options.cb) {
              options.cb();
            }
            return;
          }
          if (!self.paused) {
            window.requestAnimationFrame(loop);
          }
        } else {
          self.falling = false;
          self.lanes[self.curLane].push({shade: self.$activeShade, y: max_y});
          self.$activeShade.on(ANIMATION_END_EVENTS, function() {
            self.$activeShade
              .removeClass('landing')
              .off(ANIMATION_END_EVENTS);
            self.updateScore(2);
            self.checkCombine(self.curLane, function () {
              self.postCombine();
            });
          });

          self.$activeShade
            .addClass('landing')
            .css({
              'transform': 'translate3d(0, ' + max_y + 'px, 0)',
              '-webkit-transform': 'translate3d(0, ' + max_y + 'px, 0)'
            });
        }
      }
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
        .addClass('shade-combine bg-' + color + ' lane-' + lane)
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
          .removeClass('bg-' + color)
          .addClass('bg-' + (color + 1))
          .css({height: SHADE_HEIGHT + 'px'});
        }, 100);
    };

    this.replaceCombine = function (lane, color, len) {
      var max_y = this.getY(len - 2),
          newShade = $('<div />')
            .addClass('shade bg-' + color + ' lane-' + lane)
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

    this.postCombine = function () {
      if (this.isTutorial) {
        return this.tutorialCallback();
      }
      if (this.lanes[0].length + this.lanes[1].length + this.lanes[2].length + this.lanes[3].length > 4) {
        this.adfOff();
      }
      if (this.checkDeath()) {
        this.dead();
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
        this.updateBest(this.score);
      }
      this.updateLevel();
      this.$livescore.text(this.score);
      this.$score.text(this.score);
    };

    this.updateBest = function (best) {
      this.best = best;
      localStorage.setItem('shades-best', this.best);
      this.$best.text(this.best);
    };

    this.updateLevel = function () {
      this.level = Math.floor(this.score/ 100) + 1;
      $('.level span').text(this.level);
    };

    this.createShade = function (options /* lane,color,position,y,class */) {
      var y = options.y !== void 0 ? options.y : this.getY(options.position);
      var shade = $('<div />')
          .addClass('shade lane-' + options.lane + ' bg-' + options.color)
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

    this.updateTheme = function (theme) {
      var self = this;
      $('.btn-begin.up .content').on(ANIMATION_END_EVENTS, function () {
        $('.btn-begin.up .content').off(ANIMATION_END_EVENTS);
        self.theme = theme === undefined ? (parseInt(self.theme, 10) + 1) : theme;
        if (self.theme > MAX_THEME) {
          self.theme = 0;
        }
        localStorage.setItem('shades-theme', self.theme);
        self.$game
          .removeClass(ALL_THEME_CLASS)
          .addClass('theme-' + self.theme);
        $('.btn-begin .content').addClass('in');
        $('#wx_pic img').attr('src', 'images/theme' + self.theme + '.jpg');
      });

      $('.btn-begin .content').removeClass('in');
    };

    this.speedUp = function () {
      this.$activeShade.css({
        'transform': 'translate3d(0, ' + (SPEED.FAST + (this.level - 1) * SPEED.LEVEL_INC) + 'px, 0)',
        '-webkit-transform': 'translate3d(0, ' + (SPEED.FAST + (this.level - 1) * SPEED.LEVEL_INC) + 'px, 0)',
      });
    };

    this.randomColor = function () {
      var index = -1;
      for (var i = 0; i < 5; i++) {
        if (this.shades[i] !== 0) {
          index = i;
        }
      }
      var possibles = index + 1;
      possibles = possibles > 3 ? 3 : possibles;
      return this._random(0, possibles);
    };

    this.randomLane = function () {
      return this._random(0, 3);
    };

    this.moveTo = function (lane) {
      if (this.falling) {
        if (this.validateMove(this.curLane, lane)) {
          this.curLane = lane;
          this.$activeShade
            .removeClass('lane-0 lane-1 lane-2 lane-3')
            .addClass('lane-' + lane);
        }
      }
    };

    this.validateMove = function (from, to) {
      for (var i = Math.min(from, to); i <= Math.max(from, to); i++) {
        if (i !== from) {
          if (this.y + SHADE_HEIGHT > this.getY(this.lanes[i].length)) {
            return false;
          }
        }
      }
      return true;
    };

    this.getY = function (len) {
      return len === 0 ? MAX_Y : MAX_Y - len * SHADE_HEIGHT + 1;
    };

    this.getBottom = function (len) {
      return AD_HEIGHT + (len === 0 ? 0 : (len * SHADE_HEIGHT - 1));
    };

    this.adfOn = function () {
      if (this.adf) {
        this.$ads.addClass('adf');
        this.$ad.show();
      }
    };

    this.adfOff = function () {
      if (this.adf) {
        this.$ads.removeClass('adf');
        this.$ad.hide();
        this.adf = false;
      }
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

  new Game(options).start();

});
