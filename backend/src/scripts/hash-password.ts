import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Usage: npm run hash-password -- "your-password"  (min 8 characters)');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log('\nPaste this into backend/.env (keep the single quotes):\n');
console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`);
