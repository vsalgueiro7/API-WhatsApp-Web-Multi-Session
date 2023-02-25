import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import './shared/services/translationsYup';
import { router } from './routes';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const server = express();
server.use(cors({
    origin: process.env.ENABLED_CORS?.split(';') || []
  }));
server.use(express.json());
server.use(router);


export { server };