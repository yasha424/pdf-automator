import express, { Request, Response } from "express";
import { DataBase } from './db';

const router = express.Router();
// const db = new DataBase();

router.get('/register', (req: Request, res: Response) => {
  const query = req.query;
  console.log(query);
  

  if (query.email !== undefined && query.password != undefined && query.password == query.repassword) {
    DataBase.shared.insert('users', 'firstName, lastName, email, password', `"${query.first}", "${query.last}", "${query.email}", "${query.password}"`, (err) => {
      if (err == null) {
        return res.redirect('/main' + `?email=${query.email}&lastName=${query.last}&firstName=${query.first}`);
      }
      return res.json({ status: 401 });
    });
  }
});

router.get('/login', async (req: Request, res: Response) => {
  const query = req.query;

  DataBase.shared.get('users', ['firstName', 'lastName', 'email'], ['email', 'password'], [query.email, query.password], (err, user) => {
    if (user != null) {
      return res.redirect(`/html/main.html?email=${user.email}&firstName=${user.firstName}&lastName=${user.lastName}`);
    } 
    return res.json({ status: 401 });
  });
});

export { router as loginRouter };