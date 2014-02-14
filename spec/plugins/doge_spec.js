var DOGE = require(__dirname + '/../../plugins/doge');

//Mock bot
var bot = {
  say: function(to, msgOut) {
    console.log(msgOut);
  }
};

describe('!doge', function() {
  describe('Vault of Satoshi', function() {
    it('parses JSON successfully', function(done) {
      var bot = {
        say: function(to, msgOut) {
          expect(msgOut).not.toMatch(/Vault of Satoshi: very confuse/);
          expect(msgOut).toMatch(/Vault of Satoshi: \$\d\.\d+/);
        }
      };
      DOGE.Plugin.prototype.doge(bot, {}, 'nobody', 'nothing', done);
    }, 5000);
  });

  describe('Cryptsy', function() {
    it('parses JSON successfully', function(done) {
      var bot = {
        say: function(to, msgOut) {
          expect(msgOut).not.toMatch(/Cryptsy: very confuse/);
          expect(msgOut).toMatch(/Cryptsy: Ֆ\d+/);
        }
      };
      DOGE.Plugin.prototype.doge(bot, {}, 'nobody', 'nothing', done);
    }, 5000);
  });

  describe('Vicurex', function() {
    it('parses JSON successfully', function(done) {
      var bot = {
        say: function(to, msgOut) {
          expect(msgOut).not.toMatch(/Vicurex: very confuse/);
          expect(msgOut).toMatch(/Vicurex: Ֆ\d+/);
        }
      };
      DOGE.Plugin.prototype.doge(bot, {}, 'nobody', 'nothing', done);
    }, 5000);
  });

  describe('CoinEx', function() {
    it('parses JSON successfully', function(done) {
      var bot = {
        say: function(to, msgOut) {
          expect(msgOut).not.toMatch(/CoinEx: very confuse/);
          expect(msgOut).toMatch(/CoinEx: Ֆ\d+/);
        }
      };
      DOGE.Plugin.prototype.doge(bot, {}, 'nobody', 'nothing', done);
    }, 5000);
  });
});

describe('!dc', function() {
  it('Converts Successfully', function(done) {
    var bot = {
      say: function(to, msgOut) {
        expect(msgOut).not.toMatch(/Cannot do/);
        expect(msgOut).toMatch(/\d+(\.\d+)? is \$\d+\.\d{2}/);
      }
    };
    DOGE.Plugin.prototype.dc(bot, {}, 'nobody', 'nothing', done);
  }, 5000);
});

describe('!btc', function() {
  it('Converts Successfully', function(done) {
    var bot = {
      say: function(to, msgOut) {
        expect(msgOut).toMatch(/BTC: Coinbase: \d+/);
      }
    };
    DOGE.Plugin.prototype.btc(bot, {}, 'nobody', 'nothing', done);
  }, 5000);
});
