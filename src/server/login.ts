import express, { Request, Response } from 'express';
import { DataBase } from './db';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const router = express.Router();
const scryptAsync = promisify(scrypt);

router.get('/register', async (req: Request, res: Response) => {
  const { first, last, email, password, repassword } = req.query;

  if (first && last && email && password && typeof password === 'string' && password == repassword) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    DataBase.shared.get('users', ['1'], ['email'], [email], (err, user) => {
      if (!user) {
        DataBase.shared.insert('users', 'firstName, lastName, email, password', `"${first}", "${last}", "${email}", "${hashedPassword}"`, (err) => {
          if (err == null) {
            res.cookie('email', email, { maxAge: 60 * 60 * 1000 });
            res.cookie('firstName', first, { maxAge: 60 * 60 * 1000 });
            res.cookie('lastName', last, { maxAge: 60 * 60 * 1000 });
            res.cookie('admin', false, { maxAge: 60 * 60 * 1000 });
    
            return res.redirect('/main');
          }
          return res.redirect('/register?errCode=401');
        });    
      } else {
        return res.redirect('/register?errCode=409');
      }
    });
  } else {
    return res.redirect('/register?errCode=400');
  }
});

router.get('/login', async (req: Request, res: Response) => {
  const { email, password } = req.query;

  if (!email || !password || (typeof password !== 'string')) {
    return res.redirect('/login?errCode=401');
  }

  DataBase.shared.get('users', ['firstName', 'lastName', 'email', 'password', 'admin'], ['email'], [email], async (err, user) => {
    if (err) {
      return res.redirect('/login?errCode=400');
    }
    if (user != undefined) {
      const [hashedPassword, salt] = user.password.split(".");
      if (!hashedPassword || !salt) {
        return res.redirect('/login?errCode=400');
      }
      const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
      const suppliedPasswordBuf = (await scryptAsync(password, salt, 64)) as Buffer;
      const isPasswordValid = timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);

      if (isPasswordValid) {
        res.cookie('email', user.email, { maxAge: 60 * 60 * 1000 });
        res.cookie('firstName', user.firstName, { maxAge: 60 * 60 * 1000 });
        res.cookie('lastName', user.lastName, { maxAge: 60 * 60 * 1000 });
        res.cookie('admin', user.admin, { maxAge: 60 * 60 * 1000 });

        return res.redirect('/main');
      }
      return res.redirect('/login?errCode=402');
    } 
    return res.redirect('/login?errCode=401');
  });
});

router.post('/change-privilege', async (req: Request, res: Response) => {
  const { email, key, admin } = req.body;
  
  if (key == process.env.CHANGE_PRIVILEGE_KEY) {
    DataBase.shared.update('users', ['admin'], ['email'], [admin], [email, admin], err => {
      if (err == null) {
        return res.json({ status: 200 });
      } else {
        return res.json({ status: 404, error: err });
      }
    });
  } else {
    return res.json({ status: 204 });
  }
});

export { router as loginRouter };