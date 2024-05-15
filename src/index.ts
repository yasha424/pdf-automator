import fs from 'fs';
import express, { Express, Request, Response } from "express";
import { pdfRouter } from './server/pdf';
import { loginRouter } from './server/login';
import path from 'path';

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.use('/pdf', pdfRouter);
app.use('/api', loginRouter);

app.get('/login', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/html/login.html');
});
app.get('/register', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/html/register.html');
});
app.get('/main', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/html/main.html');
});
app.get('/editor', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/html/editor.html');
});

app.listen(port, () => {
  console.log(`[server]: Server is running on port ${port}`);
});
