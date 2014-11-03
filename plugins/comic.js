var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var async = require('async');
var Canvas = require('canvas');
var Image = Canvas.Image;
var _ = require('underscore');
var pkgcloud = require('pkgcloud');

var comics = require('../comics/comics.json');



/*
 * Comic plugin
 *   - comic: Repeats whatever is passed with the command
 */
var Comic = function() {
  this.commands = ['comic', 'listcomics'];
  this.usage = {
    comic: 'Creates a comic from recent chat. Optionally provide a comic template name to be used.',
    listcomics: 'Lists the available comic templates.'
  };
};

function getComic(name) {
  return {
    name: name,
    info: comics[name]
  };
}

function getRandomComic() {
  var comicNames = Object.keys(comics),
      name = comicNames[crypto.randomBytes(100)[0] % comicNames.length];

  return getComic(name);
}

function textBoundingBox(ctx, text, x, y, width, height, fontSize) {
  var words = text.split(' '),
      newLine = '',
      lines = [],
      fontSize = fontSize || 22,
      fontHeight = 0,
      totalHeight = 0,
      verticalSpace = 0,
      fontX = x,
      fontY = 0,
      te;

  ctx.font = fontSize + 'px Helvetica';
  te = ctx.measureText(text);
  fontHeight = te.emHeightAscent + te.emHeightDescent;
  verticalSpace = fontHeight * .9;
  fontY = y + fontHeight;

  for (var ii = 0; ii < words.length; ii++) {
    var testLine = newLine + words[ii] + ' ';
    te = ctx.measureText(testLine);
    if (te.width > width && ii > 0) {
      lines.push(newLine);
      newLine = words[ii] + ' ';
    } else {
      newLine = testLine;
    }
  }

  lines.push(newLine);

  if (lines.length === 1 && ctx.measureText(lines[0]).width > width) {
    return textBoundingBox(ctx, text, x, y, width, height, fontSize - 1);
  }

  lines.forEach(function(line) {
    var lineHeight = te.emHeightAscent + te.emHeightDescent;
    totalHeight += lineHeight
  });


  if (totalHeight > height && lines.length !== 1) {
    textBoundingBox(ctx, text, x, y, width, height, fontSize - 1);
  } else if (totalHeight <= height - fontHeight && lines.length !== 1) {
    textBoundingBox(ctx, text, x, y, width, height, fontSize + 1);
  } else {
    lines.forEach(function(outLine) {
      ctx.fillText(outLine, fontX, fontY);
      fontY += verticalSpace;
    });
  }
}

/**
 * List comics command.
 */
Comic.prototype.listcomics = function(bot, to, from, msg, callback) {
  bot.say(to, 'Available comic templates: ' + Object.keys(comics).join(', '));
};

/*
 * Comic command.
 */
Comic.prototype.comic = function(bot, to, from, msg, callback) {
  var canvas,
      ctx,
      img = new Image,
      imgSrc;

  if (msg) {
    comic = getComic(msg);
  } else {
    comic = getRandomComic();
  }

  if (!comic.info) {
    comic = getRandomComic();
  }

  canvas = new Canvas(comic.info.width, comic.info.height);
  ctx = canvas.getContext('2d');

  async.auto({
    img: function(callback) {
      fs.readFile(path.resolve(bot.config.comics.dir, comic.name + '.png'), function(err, data) {
        if (err) {
          callback(err);
          return;
        }

        img.src = data;
        ctx.drawImage(img, 0, 0);
        callback();
      });
    },

    logs: function(callback) {
      bot.getLogs(to, 100, null, function(err, logs) {
        if (err) {
          callback(err);
          return;
        }

        var filteredLogs = [],
            logCounter = 0,
            lolRegex = /lol/g,
            hahaRegex = /haha/g,
            log;

        while (filteredLogs.length < comic.info.bubbles.length) {
          log = logs[logCounter].msg;
          if (log.indexOf('!') === -1 && !lolRegex.test(log) && !hahaRegex.test(log)) {
            filteredLogs.push(logs[logCounter]);
          }
          logCounter++;
        }
        callback(null, filteredLogs.reverse());
      });
    },

    drawText: ['img', 'logs', function(callback, results) {
      var logs = results.logs;
      try {
        _.each(comic.info.bubbles, function(bubble, i) {
          textBoundingBox(ctx, logs[i].msg, bubble.x, bubble.y, bubble.width, bubble.height);
        });
      } catch (e) {
        callback(e);
        return;
      }
      callback();
    }],

    upload: ['drawText', function(callback, results) {
      var filename = 'comic-' + to.replace(/#/g, '') + '-' + Date.now() + '.png',
          file = canvas.pngStream(),
          fileOptions = {
            container: bot.config.rackspace.container,
            remote: filename,
            size: file.length
          },
          client,
          fileUpload;

      client = pkgcloud.storage.createClient({
        provider: 'rackspace',
        username: bot.config.rackspace.user,
        apiKey: bot.config.rackspace.apiKey,
        region: bot.config.rackspace.region
      });

      fileUpload = client.upload(fileOptions);

      fileUpload.on('error', function(err) {
        callback();
      });

      fileUpload.on('success', function(uploadedFile) {
        callback(null, uploadedFile.name);
      });

      console.log('UPLOADING FILE', filename);
      file.pipe(fileUpload);
    }]
  }, function(err, results) {
    if (err) {
      console.log('Error creating comic.', err);
      bot.say(to, 'Error creating comic.');
      callback();
      return;
    }
    bot.say(to, 'New comic uploaded at ' + bot.config.comics.domain + results.upload);
    callback();
  });
};


exports.Plugin = Comic;
