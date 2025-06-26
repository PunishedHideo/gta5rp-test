import { Request, Response } from 'express';
import {
  loginService,
  registerService,
  authService,
  authLogoutService,
} from './service.js';

export async function loginController(req: Request, res: Response) {
  const service = await loginService(req.body.login, req.body.password);
  // error handling here if error then 500
  if (!(service instanceof Error)) {
    res.cookie('access_token', service, {
      httpOnly: true,
      secure: true, // TODO might not work in http development but we'll see
      sameSite: 'none', // will do in https
      maxAge: 1 * 60 * 60 * 1000, // 1 hr access token TTL
      path: '/',
    });
    res.status(200).send('ok');
  } else {
    res.status(401).send(service);
  }
}

export async function registerController(req: Request, res: Response) {
  const service = await registerService(req.body.login, req.body.password);

  if (service === 'ok') {
    res.status(200).send(service);
  } else {
    res.status(400).send(service);
  }
  // error handling here if error then 500
}

export async function authController(req: Request, res: Response) {
  // console.log(req.cookies.access_token)
  const service = await authService(req.cookies.access_token);

  if (service === 'ok' || typeof service == 'string') {
    res.status(200).json(service); // stub
  } else {
    res.status(401).send(service);
  }
  // error handling here if error then 500
}

export async function authLogoutController(req: Request, res: Response) {
  // console.log(req.cookies.access_token)
  const service = await authLogoutService(req.cookies.access_token);

  if (service === 'ok') {
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: true, // TODO might not work in http development but we'll see
      sameSite: 'none', // will do in https
      expires: new Date(0),
      path: '/',
    });
    res.status(200).send('ok');
  } else {
    res.status(403).send(service);
  }
  // error handling here if error then 500
}

export async function setFieldController() {}
