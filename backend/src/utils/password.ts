import bcrypt from "bcryptjs";

const DEFAULT_BCRYPT_ROUNDS = 12;

function getBcryptRounds(): number {
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? DEFAULT_BCRYPT_ROUNDS);

  if (!Number.isFinite(rounds) || rounds < 10 || rounds > 14) {
    return DEFAULT_BCRYPT_ROUNDS;
  }

  return Math.floor(rounds);
}

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, getBcryptRounds());
}

function verifyPassword(password: string, hash: string): boolean {
  if (!isBcryptHash(hash)) {
    // Legacy fallback for existing plain-text passwords until they are upgraded.
    return password === hash;
  }

  return bcrypt.compareSync(password, hash);
}

export { hashPassword, verifyPassword, isBcryptHash };
