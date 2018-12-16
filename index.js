#!/usr/bin/env node

/**
 * Copyright 2018 Keikhosro Safavi
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License in the LICENSE file in the
 * root directory of this source tree.
 */

'use strict';

const commander = require('commander');
const {
    spawn
} = require('child_process');

const packageJson = require('./package.json');

const isNullOrWhiteSpace = (str) => (str || '').trim() === '';

const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .usage('[--registry=url] [--scope=@orgname] [--always-auth] [--auth-type=legacy]')
    .option('-r --registry <registry>', 'The base URL of the npm package registry')
    .option('-s --scope <scope>', 'If specified, the user and login credentials given will be associated with the specified scope')
    .option('-a --always-auth', 'If specified, save configuration indicating that all requests to the given registry should include authorization information')
    .option('-t --auth-type <authType>', 'What authentication strategy to use with')
    .option('-u --username <username>', 'Name of user to fetch starred packages for')
    .option('-p --password <password>', 'Password of the user')
    .option('-e --email <email>', 'Email of the user')
    .parse(process.argv);

const args = ['adduser'];

const registry = isNullOrWhiteSpace(program.registry) ? process.env.NPM_REGISTRY : program.registry;
if (!isNullOrWhiteSpace(registry)) {
    args.push('--registry=' + registry.trim());
}

const scope = isNullOrWhiteSpace(program.scope) ? process.env.NPM_SCOPE : program.scope;
if (!isNullOrWhiteSpace(scope)) {
    args.push('--scope=' + scope.trim());
}

if (!isNullOrWhiteSpace(program.authType)) {
    args.push('--auth-type=' + program.authType.trim());
}

const username = isNullOrWhiteSpace(program.username) ? process.env.NPM_USER : program.username;
if (isNullOrWhiteSpace(username)) {
    process.stderr.write('Username is required');
    process.exit(1);
}

const password = isNullOrWhiteSpace(program.password) ? process.env.NPM_PASS : program.password;
if (isNullOrWhiteSpace(password)) {
    process.stderr.write('Password is required');
    process.exit(1);
}

const email = isNullOrWhiteSpace(program.email) ? process.env.NPM_EMAIL : program.email;
if (isNullOrWhiteSpace(email)) {
    process.stderr.write('Email is required');
    process.exit(1);
}

const npm = spawn('npm', args, {
    stdio: ['pipe', 'pipe', 'inherit'],
    shell: true
});

function checkStep(step, count) {
    if (count > step) {
        process.exit(1);
    }
}

let count = 0;
npm.stdout.on('data', (data) => {
    const str = data.toString();
    process.stdout.write(str);
    if (str.match(/username/i)) {
        checkStep(0, count);
        process.stdout.write(`${username}\n`);
        npm.stdin.write(username + '\n');
    } else if (str.match(/password/i)) {
        checkStep(1, count);
        process.stdout.write('\n');
        npm.stdin.write(password + '\n');
    } else if (str.match(/email/i)) {
        checkStep(2, count);
        process.stdout.write(`${email}\n`);
        npm.stdin.write(email + '\n');
        npm.stdin.end();
    } else if (str.match(/.*err.*/i)) {
        npm.stdin.end();
    }
    count++;
});

npm.on('exit', (code) => {
    process.exit(code);
});
