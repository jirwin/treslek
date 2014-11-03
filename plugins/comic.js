var fs = require('fs');
var path = require('path');

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
  this.commands = ['comic'];
  this.usage = {
    comic: 'Creates a comic from recent chat'
  };
};

function getRandomComic() {
  var comicNames = Object.keys(comics),
      name = comicNames[_.random(comicNames.length - 1)];

  return {
    name: name,
    info: comics[name]
  };
}

function textBoundingBox(ctx, text, x, y, width, height, fontSize) {
  var words = text.split(' '),
      newLine = '',
      lines = [],
      fontSize = fontSize || 22,
      fontHeight = 0,
      totalHeight = 0,
      verticalSpace = 0,
      fontX = x - 4,
      fontY = 0,
      te;

  ctx.font = fontSize + 'px Helvetica';
  te = ctx.measureText(text);
  fontHeight = te.emHeightAscent + te.emHeightDescent;
  verticalSpace = fontHeight * .9;
  fontY = y + fontHeight;

  while(words.length > 0) {
    te = ctx.measureText(newLine + ' ' + words[0]);
    if (te.width > width) {
      lines.push(newLine);
      newLine = '';
    } else {
      newLine += ' ' + words.shift();
    }
  }

  lines.push(newLine);

  lines.forEach(function(line) {
    var lineHeight = te.emHeightAscent + te.emHeightDescent;
    totalHeight += lineHeight
  });


  if (totalHeight > height) {
    textBoundingBox(ctx, text, x, y, width, height, fontSize - 1);
  } else if (totalHeight <= height - fontHeight) {
    textBoundingBox(ctx, text, x, y, width, height, fontSize + 1);
  } else {
    lines.forEach(function(outLine) {
      ctx.fillText(outLine, fontX, fontY);
      fontY += verticalSpace;
    });
  }
}

/*
 * Comic command.
 */
Comic.prototype.comic = function(bot, to, from, msg, callback) {
  var comic = getRandomComic(),
      canvas = new Canvas(comic.info.width, comic.info.height),
      ctx = canvas.getContext('2d'),
      img = new Image,
      imgSrc;

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
      bot.getLogs(to, comic.info.bubbles.length, null, function(err, logs) {
        if (err) {
          callback(err);
          return;
        }
        console.dir(logs);
        logs = logs.reverse();
        callback(null, logs);
      });
    },

    drawText: ['img', 'logs', function(callback, results) {
      var logs = results.logs;
      _.each(comic.info.bubbles, function(bubble, i) {
        textBoundingBox(ctx, logs[i].msg, bubble.x, bubble.y, bubble.width, bubble.height);
      });
      callback();
    }],

    upload: ['drawText', function(callback, results) {
      var filename = 'comic-' + to.slice(1) + '-' + Date.now() + '.png',
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

      console.log('UPLOADING FILE');
      file.pipe(fileUpload);
    }]
  }, function(err, results) {
    bot.say(to, 'New comic uploaded at ' + bot.config.comics.domain + results.upload);
    callback();
  });
};


exports.Plugin = Comic;
