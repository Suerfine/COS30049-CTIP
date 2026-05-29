import request from "supertest";
import app from "../../src/server";
import { User } from "../../src/models";

type LoginCredentials = {
  username: string;
  password: string;
};

export async function login(credentials: LoginCredentials): Promise<string> {
  let username = credentials.username;
  const isSfcIdEmail = /^\d+@sfc\.gov\.my$/i.test(username);

  if (!isSfcIdEmail) {
    const user = await User.findOne({
      where: { personal_email: username },
    });

    if (user) {
      username = `${user.id}@sfc.gov.my`;
    }
  }

  const response = await request(app)
    .post("/api/token")
    .type("form")
    .send({
      ...credentials,
      username,
    });

  if (response.status !== 200) {
    throw new Error(
      `Login failed with status ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }

  const accessToken = response.body?.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new Error("Login response did not include an access token");
  }

  return accessToken;
}
