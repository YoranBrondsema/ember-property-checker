var chalk = require('chalk');

module.exports = {
  debug: function(s) {
    console.log(chalk.blue(s));
  },
  info: function(s) {
    console.log(chalk.white(s));
  },
  warning: function(s) {
    console.log(chalk.yellow(s));
  }
};
