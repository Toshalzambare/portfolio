import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ask a question via terminal
function askQuestion(query, isPassword = false) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (!isPassword) {
      rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
      });
    } else {
      // Custom masking for password input in CLI
      process.stdout.write(query);
      
      const stdin = process.stdin;
      stdin.resume();
      stdin.setEncoding('utf8');
      
      let password = '';
      
      const onData = (char) => {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.pause();
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            rl.close();
            resolve(password);
            break;
          case '\u0003': // Ctrl+C
            process.exit();
            break;
          default:
            // Backspace handling
            if (char.charCodeAt(0) === 127) {
              if (password.length > 0) {
                password = password.slice(0, -1);
                // Clear the last asterisk
                process.stdout.write('\b \b');
              }
            } else {
              password += char;
              process.stdout.write('*');
            }
            break;
        }
      };
      
      stdin.on('data', onData);
    }
  });
}

// PBKDF2 Hashing Function
function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
}

async function run() {
  console.log('==================================================');
  console.log('Secure CLI Admin Credentials Setup');
  console.log('==================================================\n');

  const password = await askQuestion('Enter a strong admin password: ', true);
  if (!password || password.trim().length < 8) {
    console.error('\nError: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const confirmPassword = await askQuestion('Confirm admin password: ', true);
  if (password !== confirmPassword) {
    console.error('\nError: Passwords do not match.');
    process.exit(1);
  }

  console.log('\nGenerating secure credentials...');

  // Generate Salt and Hash
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await hashPassword(password, salt);

  // Generate JWT secret and Encryption Key if they don't exist
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  const encryptionKey = crypto.randomBytes(32).toString('hex'); // 256 bits = 32 bytes = 64 hex characters

  const envPath = path.join(__dirname, '.env');
  let envConfig = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        envConfig[key] = value;
      }
    });
    console.log('Found existing .env file. Preserving other environment variables...');
  } else {
    console.log('Creating a new .env file...');
  }

  // Update credentials
  envConfig['ADMIN_PASSWORD_HASH'] = hash;
  envConfig['ADMIN_PASSWORD_SALT'] = salt;

  // Preserve or generate JWT_SECRET and ENCRYPTION_KEY
  if (!envConfig['JWT_SECRET']) {
    envConfig['JWT_SECRET'] = jwtSecret;
    console.log('Generated new secure JWT_SECRET.');
  } else {
    console.log('Preserved existing JWT_SECRET.');
  }

  if (!envConfig['ENCRYPTION_KEY'] || envConfig['ENCRYPTION_KEY'].length !== 64) {
    envConfig['ENCRYPTION_KEY'] = encryptionKey;
    console.log('Generated new 256-bit ENCRYPTION_KEY.');
  } else {
    console.log('Preserved existing ENCRYPTION_KEY.');
  }

  if (!envConfig['PORT']) {
    envConfig['PORT'] = '5000';
  }

  // Write back to .env
  let newEnvContent = '';
  for (const [key, val] of Object.entries(envConfig)) {
    newEnvContent += `${key}=${val}\n`;
  }

  fs.writeFileSync(envPath, newEnvContent.trim() + '\n', 'utf8');

  console.log('\n==================================================');
  console.log('SUCCESS: Admin credentials set up successfully!');
  console.log('Credentials written to .env');
  console.log('==================================================\n');
}

run().catch(console.error);
