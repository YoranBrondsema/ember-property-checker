'use strict';

var fs = require('fs');
var findFiles = require('./helpers/find-files');
var recast = require('recast');
var babel = require('babel-core');
var difference = require('lodash.difference');
var forEach = require('lodash.foreach');
var logger = require('./helpers/logger');

module.exports = PropertyChecker;

function PropertyChecker() { }

PropertyChecker.prototype.check = function(path) {
  var self = this;
  var files = findFiles(path, '.js');

  files.forEach(function(file) {
    logger.info(`Processing ${file}`);

    var source = fs.readFileSync(file);
    var ast = recast.parse(source);
    recast.visit(ast, {
      visitCallExpression: function(path) {
        var callee = path.node.callee;
        if (callee.property && callee.property.name === 'property') {
          var propName = path.parentPath.node.key.name;
          var usedProps = [];
          var dependentProps = path.node.arguments.map(function(a) {
            return a.value;
          });

          recast.visit(callee, {
            visitCallExpression: function(path) {
              var callee = path.node.callee;
              if (callee.property && callee.property.name === 'get' && callee.object.type === 'ThisExpression') {
                usedProps.push(path.node.arguments[0].value);
              }
              this.traverse(path);
            }
          });

          var usedButNotDependent = difference(usedProps, dependentProps);
          if (usedButNotDependent.length > 0) {
            forEach(usedButNotDependent, function(prop) {
              logger.warning(`Property '${propName}': property '${prop}' is used but not declared as a dependency.`);
            });
          }

          var dependentButNotUsed = difference(dependentProps, usedProps);
          if (dependentButNotUsed.length > 0) {
            forEach(dependentButNotUsed, function(prop) {
              logger.warning(`Property '${propName}': property '${prop}' is declared as a dependency but not used.`);
            });
          }

          logger.debug(`Property '${propName}' uses ${usedProps} and has dependencies ${dependentProps}`);
        }
        this.traverse(path);
      },
    });
  }, this);
}
