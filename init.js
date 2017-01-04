const chalk = require('chalk');
const fs = require('fs');

global.config = JSON.parse(fs.readFileSync('config.json'));
global.devmode = process.env.NODE_ENV !== 'production';
global.userCreationToken = Math.random().toString(36).toUpperCase().slice(2, 8);
console.log(chalk.cyan('User Creation Token : ' + userCreationToken));

require('./src/mongo');
