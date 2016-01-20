'use strict';

var exec = require('child_process').exec;

function returnInt (item) {
  return parseInt(item.trim(), 10);
}

function listeners (port, done) {
  var settings, command, rpid, sudo;

  if (typeof port === 'number') {
    settings = { port: port };
  } else {
    settings = port;
  }

  if (process.platform === 'win32') {
    sudo = 'runas /noprofile /user:Administrator';
    command = 'netstat -n -a -o | grep -i listening | grep :' + settings.port;
    rpid = /\d+$/gm;
  } else {
    sudo = 'sudo';
    command = '( lsof -i tcp:' + settings.port + ' | grep -i listen ) ; rc=$? ; if (( rc >= 2 )) ; then exit $rc ; else exit 0 ; fi'; /*
      grep exits with return code 1 if it did not match any input lines.
      If grep fails, then it exists with a return code >= 2.
      */
    rpid = / \d+ (?=(.*)IPv\d)/gm;
  }

  if (settings.elevate) {
    command = sudo + ' ' + command;
  }

  exec(command, function (err, data) {
    if (err) {
      if (err.message === 'Command failed: ') {
        done(null, [], data, err); // an error executing the command translates to no pids
      } else {
        done(err, [], data, err);
      }
      return;
    }
    var pids = (data.match(rpid) || []).map(returnInt);
    done(null, pids, data);
  });
}

module.exports = {
  listeners: listeners
};
