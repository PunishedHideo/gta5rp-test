// @ts-nocheck
// it is test assignment - the typescript is peak in a big projects but in test assignment it is not really needed

import { CreateConnection, DbManipulation } from './db.js';
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
// Either make new connection to db here or in the db.ts
// It doesn't really matter in the test work but in real project
const pool = new CreateConnection(
  process.env.DB_HOST!, // ignoring types
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  process.env.DB_DATABASE!,
).createPool();
new DbManipulation(pool).createTable(); // creates players table if not exists

export async function loginService(login: string, password: string) {
  const result = await new DbManipulation(pool).checkCredentials(login);

  // error checking is primitive and could be done more custom but will be enough

  if (result[0][0]?.password === password) {
    // ts error fix

    const token = jsonwebtoken.sign(
      // NOTE signing token and sending later
      {
        nickname: login,
      },
      process.env.JWT_PRIVATE_KEY!,
    ); // NOTE bad in prod

    return token;
  } else {
    return new Error('not ok');
  }
  // TODO compare passwords from params and result returned
}

export async function registerService(login: string, password: string) {
  const result = await new DbManipulation(pool).newPlayer(login, password);

  // error checking is primitive and could be done more custom but will be enough

  if (result[0]) {
    // ts error fix
    return 'ok';
  } else {
    return new Error('not ok');
  }
}

export async function authService(token: string) {
  // console.log(token)

  // error checking is primitive and could be done more custom but will be enough
  try {
    const decoded = jsonwebtoken.verify(
      token,
      process.env.JWT_PRIVATE_KEY!,
    ) as { nickname: string };

    const result = await new DbManipulation(pool).checkCredentials(
      // if the jwt is malformed this won't
      // execute and will straight up give not ok
      decoded.nickname,
    );

    if (result[0][0]?.nickname === decoded.nickname) {
      // if true - successful auth
      return decoded.nickname; // result[0][0]?.nickname;
    } else {
      return new Error('not ok');
    }
    // i think this type of check will be enough for now
  } catch (error) {
    return new Error('not ok');
  }
}

export async function authLogoutService(token: string) {
  // console.log(token)

  // error checking is primitive and could be done more custom but will be enough
  try {
    const decoded = jsonwebtoken.verify(
      token,
      process.env.JWT_PRIVATE_KEY!,
    ) as { nickname: string };

    const result = await new DbManipulation(pool).checkCredentials(
      // if the jwt is malformed this won't
      // execute and will straight up give not ok
      decoded.nickname,
    );

    if (result[0][0]?.nickname === decoded.nickname) {
      return 'ok';
    } else {
      return new Error('not ok');
    }
    // i think this type of check will be enough for now
  } catch (error) {
    return new Error('not ok');
  }
}
