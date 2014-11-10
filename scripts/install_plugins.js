var fs = require('fs');
var path = require('path');

var npm = require('npm');
var async = require('async');

var config = require('../conf.json');

function main() {
  npm.load(null, function(err) {
    var pluginsToInstall = [],
        installedPlugins = [];

    fs.readdirSync(config.plugins_dir).forEach(function(file) {
      var stat = fs.lstatSync(path.resolve(config.plugins_dir, file));

      if (stat.isSymbolicLink() && config.plugins.indexOf(file) !== -1) {
        installedPlugins.push(file);
      }
    });

    pluginsToInstall = config.plugins.filter(function(plugin) {
      return installedPlugins.indexOf(plugin) === -1;
    });

    async.forEach(pluginsToInstall, function(plugin, callback) {
      npm.commands.install([plugin], function(err, data) {
        callback();
      });
      npm.on('log', function(msg) {
        console.log(msg);
      });
    }, function(err) {
      pluginsToInstall.forEach(function(plugin) {
        fs.symlinkSync(path.resolve(__dirname, '../node_modules', plugin),
                       path.resolve(config.plugins_dir, plugin), 'dir');
      });
    });
  });
}

main();
