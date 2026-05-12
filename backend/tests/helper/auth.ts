import request from "supertest";
import app from "../../src/server";

type LoginCredentials = {
  username: string;
  password: string;
};

export async function login(credentials: LoginCredentials): Promise<string> {
  const response = await request(app)
    .post("/api/token")
    .type("form")
    .send(credentials);

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
