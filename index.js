#!/usr/bin/env node

var fs            = require('fs');
var prompt        = require('prompt');
var args          = process.argv.slice(2);
var cmd           = args.shift();
var configPath    = process.env.HOME + '/.brisk-content.config.json';
var contentServer = require('./lib/contentServer.js');
var GithubAPI     = require('github');
var config, configPromptSchema, server, github;

github = new GithubAPI({
  version: '3.0.0'
});

configPromptSchema = [{
  name: 'contentServerAddress',
  type: 'string',
  description: 'Content server address'
}, {
  name: 'cardRepo',
  type: 'string',
  description: 'Card repo'
}, {
  name: 'githubAccessToken',
  type: 'string',
  description: 'Github access token'
}];

try {
  config = JSON.parse(
    fs.readFileSync(configPath, 'utf-8')
  );
  main();
}
catch (err) {
  console.log('No config file found in home directory. Let\'s create one.');
  prompt.start();

  prompt.get(
    configPromptSchema,
    function (err, result) {
      if (err) {
        //
      }
      config = result;
      console.log(result);
      saveConfig();
      main();
    }
  );
}

function main () {
  server = contentServer(config.contentServerAddress);

  github.authenticate({
    type: 'oauth',
    token: config.githubAccessToken
  });

  switch (cmd) {
    case 'querySelector':
      performQuerySelectorRequest(args[0]);
      break;
    case 'deprecateSelector':
      deprecateSelector(args[0], args[1]);
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

function deprecateSelector (selector, milestone) {
  server.querySelector(selector, function (cards) {
    var lastOrgId, issuesCreated = 0;

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
    console.log('\nCreating github issues...');

    cards.forEach(function (card, idx) {
      github.issues.create({
        user: 'dexplora',
        repo: config.cardRepo,
        title: '[OrgId '+ card.orgId + ']: Resolve deprecated directive "' + selector + '" on '+ card.cardname,
        milestone: milestone,
        labels: ['deprecated', 'template']
      }, function (err, data) {
        if (err) {
          console.log(JSON.parse(err).message);
        }
        else if (data) {
          issuesCreated++;
        }

        if (idx === cards.length-1) {
          console.log('Done!');
        }
      });
    });
  });
};

function showHelp () {
  console.log('Brisk content CLI');
};

function saveConfig () {
  fs.writeFileSync(configPath, JSON.stringify(config) + '\n');
};


