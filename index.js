#!/usr/bin/env node

var fs            = require('fs');
var prompt        = require('prompt');
var args          = process.argv.slice(2);
var cmd           = args.shift();
var configPath    = process.env.HOME + '/.brisk-content.config.json';
var contentServer = require('./lib/contentServer.js');
var config, server;

var configPromptSchema = [{
  name: 'contentServerAddress',
  type: 'string',
  description: 'Content server address'
}, {
  name: 'cardRepo',
  type: 'string',
  description: 'Card repo'
}];

try {
  config = JSON.parse(
    fs.readFileSync(configPath, 'utf-8')
  );
  main();
}
catch (err) {
  config = {};
  console.log('No config file found in home directory. Let\'s create one.');
  prompt.start();

  prompt.get(
    configPromptSchema,
    function (err, result) {
      if (err) {
        //
      }
      config.cardRepo             = result.cardRepo;
      config.contentServerAddress = result.contentServerAddress;

      saveConfig();
      main();
    }
  );
}

function main () {
  server = contentServer(config.contentServerAddress);

  switch (cmd) {
    case 'querySelector':
      performQuerySelectorRequest(args[0]);
      break;
    case 'help':
      default:
      showHelp();
  }
};

function performQuerySelectorRequest (selector) {
  server.querySelector(selector, function (cards) {
    var lastOrgId;

    if (!cards.length) {
      console.log('Found no matches');
      return;
    }

    console.log('Found ' + cards.length + ' matches for "' + selector + '":\n');

    cards.forEach(function (card) {
      if (lastOrgId !== card.orgId) {
        console.log('OrgId ' + card.orgId + ':');
        lastOrgId = card.orgId;
      }
      console.log('\t- ' + card.cardname);
    });
  });
};

function showHelp () {
  console.log('Brisk content CLI');
};

function saveConfig () {
  fs.writeFileSync(configPath, JSON.stringify(config) + '\n');
};


