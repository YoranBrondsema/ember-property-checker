'use strict';

var program = require('commander');
var PropertyChecker = require('./property-checker');
var propertyChecker = new PropertyChecker();
var version = require('../package.json').version;

program
  .version(version);

program
  .command('check [appPath]')
  .description('Checks all properties. appPath defaults to app/')
  .action(function(appPath) {
    appPath = appPath || 'app';
    propertyChecker.check(appPath);
  });

module.exports = function init(args) {
  program.parse(args);
};
