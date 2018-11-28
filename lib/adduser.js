const commander = require('commander');
const { spawn } = require('child_process');

const packageJson = require('../package.json');

const isNullOrWhiteSpace = (str) => (str || '').trim() === '';

const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .option('--registry <registry>', 'The base URL of the npm package registry')
    .option('--scope <scope>', 'If specified, the user and login credentials given will be associated with the specified scope')
    .option('--always-auth', 'If specified, save configuration indicating that all requests to the given registry should include authorization information')
    .option('--auth-type <authType>', 'What authentication strategy to use with')
    .option('--username <username>', 'Name of user to fetch starred packages for')
    .option('--password <password>', 'Password of the user')
    .option('--email <email>', 'Email of the user')
    .parse(process.argv);

const args = ['adduser'];

const registry = isNullOrWhiteSpace(program.registry) ? process.env.NPM_REGISTRY : program.registry;
if (!isNullOrWhiteSpace(registry)) {
    args.push('--registry=' + registry.trim());
}

if (!isNullOrWhiteSpace(program.scope)) {
    args.push('--scope=' + program.scope.trim());
}

if (!isNullOrWhiteSpace(program.alwaysAuth)) {
    args.push('--always-auth');
}

if (!isNullOrWhiteSpace(program.authType)) {
    args.push('--auth-type=' + program.authType.trim());
}

const username = isNullOrWhiteSpace(program.username) ? process.env.NPM_USER : program.username;
if (isNullOrWhiteSpace(username)) {
    console.error('Username is required');
    process.exit(1);
}

const password = isNullOrWhiteSpace(program.password) ? process.env.NPM_PASS : program.password;
if (isNullOrWhiteSpace(password)) {
    console.error('Password is required');
    process.exit(1);
}

const email = isNullOrWhiteSpace(program.email) ? process.env.NPM_EMAIL : program.email;
if (isNullOrWhiteSpace(email)) {
    console.error('Email is required');
    process.exit(1);
}

const npm = spawn('npm', args, {
    stdio: ['pipe', 'pipe', 'inherit'],
    shell: true
});

npm.stdout.on('data', (data) => {
    const str = data.toString();
    process.stdout.write(str + '\n');
    if (str.match(/username/i)) {
        npm.stdin.write(username + '\n');
    } else if (str.match(/password/i)) {
        npm.stdin.write(password + '\n');
    } else if (str.match(/email/i)) {
        npm.stdin.write(email + '\n');
    } else if (str.match(/logged in as/i)) {
        npm.stdin.end();
    }
});

npm.on('exit', (code) => {
    process.exit(code);
});

npm.on('close', (code) => {
    process.exit(code);
});