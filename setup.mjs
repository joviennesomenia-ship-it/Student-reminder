// Creates backend/.env and frontend/.env on first run. Safe to run again: never overwrites.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const backendEnv = new URL('./backend/.env', import.meta.url);
const frontendEnv = new URL('./frontend/.env', import.meta.url);

async function askPassword() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const lines = rl[Symbol.asyncIterator]();
  try {
    for (;;) {
      process.stdout.write('Admin password (at least 8 characters): ');
      const { value, done } = await lines.next();
      if (done) {
        console.error('\nNo password was entered. Run start.bat again.');
        process.exit(1);
      }
      const pw = String(value).trim();
      if (pw.length >= 8) return pw;
      console.log('That is too short. Please use at least 8 characters.');
    }
  } finally {
    rl.close();
  }
}

if (!existsSync(backendEnv)) {
  const bcryptDir = fileURLToPath(new URL('./backend/node_modules/bcryptjs', import.meta.url));
  if (!existsSync(bcryptDir)) {
    console.error('\nThe backend packages are not installed (bcryptjs is missing).');
    console.error('Looked in: ' + bcryptDir);
    console.error('Open a terminal in the backend folder and run: npm install');
    process.exit(1);
  }
  const bcrypt = createRequire(new URL('./backend/package.json', import.meta.url))('bcryptjs');

  console.log('\nChoose the password you will use to log in as the teacher (username: teacher).');
  const password = await askPassword();
  const hash = bcrypt.hashSync(password, 12);
  const secret = () => randomBytes(48).toString('hex');

  let text = readFileSync(new URL('./backend/.env.example', import.meta.url), 'utf8');
  // Replacement functions keep "$" characters in the hash from being treated as patterns.
  text = text
    .replace(/^ADMIN_PASSWORD_HASH=.*$/m, () => `ADMIN_PASSWORD_HASH='${hash}'`)
    .replace(/^JWT_ACCESS_SECRET=.*$/m, () => `JWT_ACCESS_SECRET=${secret()}`)
    .replace(/^JWT_REFRESH_SECRET=.*$/m, () => `JWT_REFRESH_SECRET=${secret()}`);
  writeFileSync(backendEnv, text);
  console.log('Created backend/.env.');
} else {
  console.log('backend/.env already exists - left unchanged.');
}

if (!existsSync(frontendEnv)) {
  writeFileSync(frontendEnv, readFileSync(new URL('./frontend/.env.example', import.meta.url)));
  console.log('Created frontend/.env.');
}
