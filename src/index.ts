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

app.listen(port, () => {
  console.log(`[server]: Server is running on port ${port}`);
});
