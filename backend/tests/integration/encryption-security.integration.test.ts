import { describe, expect, it } from "@jest/globals";
import { Registration, User } from "../../src/models";
import { RegistrationStatus } from "../../src/enum/RegistrationStatus";
import { UserRoles } from "../../src/enum/UserRoles";

async function createUser(overrides: Partial<User> = {}) {
  const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return User.create({
    username: `secure-user-${unique}`,
    firstname: "Secure",
    lastname: "User",
    identification: "900101015555",
    personal_email: "private.person@example.com",
    tel: "0199988776",
    role: UserRoles.ADMIN,
    password_hash: "hash",
    last_login_at: null,
    ...overrides,
  });
}

describe("Encryption Security Integration Tests", () => {
  it("encrypts user PII at rest and decrypts through model access", async () => {
    const user = await createUser();

    const [rows] = (await User.sequelize!.query(
      "SELECT identification, personal_email, tel FROM users WHERE id = ?",
      { replacements: [user.id] },
    )) as any[];

    const rawUser = rows[0];
    expect(rawUser.identification).toContain("enc:v1:");
    expect(rawUser.personal_email).toContain("enc:v1:");
    expect(rawUser.tel).toContain("enc:v1:");
    expect(rawUser.identification).not.toBe("900101015555");
    expect(rawUser.personal_email).not.toBe("private.person@example.com");
    expect(rawUser.tel).not.toBe("0199988776");

    const fetchedUser = await User.findByPk(user.id);
    expect(fetchedUser).not.toBeNull();
    expect(fetchedUser?.identification).toBe("900101015555");
    expect(fetchedUser?.personal_email).toBe("private.person@example.com");
    expect(fetchedUser?.tel).toBe("0199988776");
  });

  it("encrypts registration personal fields at rest", async () => {
    const registration = await Registration.create({
      status: RegistrationStatus.PENDING,
      firstname: "Aida",
      lastname: "Yusof",
      identification: "010203145566",
      personal_email: "aida.yusof@example.com",
      tel: "0131122334",
    });

    const [rows] = (await Registration.sequelize!.query(
      "SELECT firstname, lastname, identification, personal_email, tel FROM registrations WHERE id = ?",
      { replacements: [registration.id] },
    )) as any[];

    const rawRegistration = rows[0];
    expect(rawRegistration.firstname).toContain("enc:v1:");
    expect(rawRegistration.lastname).toContain("enc:v1:");
    expect(rawRegistration.identification).toContain("enc:v1:");
    expect(rawRegistration.personal_email).toContain("enc:v1:");
    expect(rawRegistration.tel).toContain("enc:v1:");

    const fetched = await Registration.findByPk(registration.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.firstname).toBe("Aida");
    expect(fetched?.lastname).toBe("Yusof");
    expect(fetched?.identification).toBe("010203145566");
    expect(fetched?.personal_email).toBe("aida.yusof@example.com");
    expect(fetched?.tel).toBe("0131122334");
  });
});
