import crypto from "crypto";

const DETERMINISTIC_PREFIX = "enc:v1";
const RANDOM_PREFIX = "encr:v1";
const GCM_ALGO = "aes-256-gcm";

function getMasterKeyMaterial(): string {
  return (
    process.env.DATA_ENCRYPTION_KEY ??
    process.env.JWT_SECRET ??
    "development-only-encryption-key-change-me"
  );
}

function deriveKey(label: string): Buffer {
  return crypto
    .createHash("sha256")
    .update(`${label}:${getMasterKeyMaterial()}`)
    .digest();
}

function getEncryptionKey(): Buffer {
  return deriveKey("enc-key");
}

function getIvDerivationKey(): Buffer {
  return deriveKey("enc-iv");
}

function deriveDeterministicIv(value: string, context: string): Buffer {
  const mac = crypto
    .createHmac("sha256", getIvDerivationKey())
    .update(`${context}:${value}`)
    .digest();
  return mac.subarray(0, 12);
}

function normalizePlaintext(value: string): string {
  return value.normalize("NFKC");
}

function encryptWithIv(value: string, iv: Buffer, prefix: string, context: string): string {
  const cipher = crypto.createCipheriv(GCM_ALGO, getEncryptionKey(), iv);
  const aad = Buffer.from(context, "utf8");
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${prefix}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptSerialized(cipherText: string, prefix: string, context: string): string {
  if (!cipherText.startsWith(`${prefix}:`)) {
    return cipherText;
  }

  const parts = cipherText.split(":");
  if (parts.length !== 5) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(parts[2], "hex");
  const authTag = Buffer.from(parts[3], "hex");
  const encrypted = Buffer.from(parts[4], "hex");

  const decipher = crypto.createDecipheriv(GCM_ALGO, getEncryptionKey(), iv);
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function isDeterministicallyEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(`${DETERMINISTIC_PREFIX}:`);
}

export function isRandomlyEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(`${RANDOM_PREFIX}:`);
}

export function encryptDeterministic(value: string, context: string): string {
  if (!value) {
    return value;
  }
  if (isDeterministicallyEncrypted(value)) {
    return value;
  }

  const normalized = normalizePlaintext(value);
  const iv = deriveDeterministicIv(normalized, context);
  return encryptWithIv(normalized, iv, DETERMINISTIC_PREFIX, context);
}

export function decryptDeterministic(value: string, context: string): string {
  if (!value || !isDeterministicallyEncrypted(value)) {
    return value;
  }
  return decryptSerialized(value, DETERMINISTIC_PREFIX, context);
}

export function encryptRandom(value: string, context: string): string {
  if (!value) {
    return value;
  }
  if (isRandomlyEncrypted(value)) {
    return value;
  }

  const iv = crypto.randomBytes(12);
  return encryptWithIv(normalizePlaintext(value), iv, RANDOM_PREFIX, context);
}

export function decryptRandom(value: string, context: string): string {
  if (!value || !isRandomlyEncrypted(value)) {
    return value;
  }
  return decryptSerialized(value, RANDOM_PREFIX, context);
}

type EncryptedFieldContext = Record<string, string>;

function transformFieldValue(value: unknown, context: string): unknown {
  if (typeof value === "string") {
    return encryptDeterministic(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => transformFieldValue(entry, context));
  }

  if (value && typeof value === "object") {
    return transformWhereForEncryptedFields(
      value as Record<string | symbol, unknown>,
      { value: context },
    );
  }

  return value;
}

export function transformWhereForEncryptedFields(
  where: Record<string | symbol, unknown> | undefined,
  fieldContexts: EncryptedFieldContext,
): Record<string | symbol, unknown> | undefined {
  if (!where || typeof where !== "object") {
    return where;
  }

  for (const key of Reflect.ownKeys(where)) {
    const currentValue = where[key as keyof typeof where];

    if (typeof key === "string" && fieldContexts[key]) {
      where[key as keyof typeof where] = transformFieldValue(
        currentValue,
        fieldContexts[key],
      ) as never;
      continue;
    }

    if (Array.isArray(currentValue)) {
      where[key as keyof typeof where] = currentValue.map((entry) => {
        if (entry && typeof entry === "object") {
          return transformWhereForEncryptedFields(
            entry as Record<string | symbol, unknown>,
            fieldContexts,
          );
        }
        return entry;
      }) as never;
      continue;
    }

    if (currentValue && typeof currentValue === "object") {
      where[key as keyof typeof where] = transformWhereForEncryptedFields(
        currentValue as Record<string | symbol, unknown>,
        fieldContexts,
      ) as never;
    }
  }

  return where;
}
