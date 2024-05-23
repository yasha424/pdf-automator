import express, { Express, Request, Response } from "express";
import { pdfRouter } from './server/pdfRouter';
import { loginRouter } from './server/login';
import path from "path";
import fs from "fs";
import https from 'https';

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));

app.use('/api', pdfRouter);
app.use('/api', loginRouter);


app.get('/', (req: Request, res: Response) => {
  res.redirect('/login');
});
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

const privateKey = fs.readFileSync(path.join(__dirname, "localhost-key.pem"));
const certificate = fs.readFileSync(path.join(__dirname, "localhost.pem"));
var credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials, app);
server.listen(port, () => {
  console.log(`[server]: Server is running on port ${port}`);
});