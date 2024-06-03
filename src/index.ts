import express, { Express, Request, Response } from "express";
import { pdfRouter } from './server/pdfRouter';
import { loginRouter } from './server/login';
import cookieParser from 'cookie-parser';

const app: Express = express();
const port = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());

app.use('/api', pdfRouter);
app.use('/api', loginRouter);

app.get('/', (req: Request, res: Response) => {
  res.redirect('/main');
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
app.get('/complaint', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/html/complaint.html');
});

app.listen(port, () => {
  console.log(`[server]: Server is running on port ${port}`);
});