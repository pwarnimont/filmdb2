import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import openapiDocument from '../openapi.json';
import env from './config/env';
import {errorHandler, notFoundHandler} from './middleware/error-handler';
import routes from './routes';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true
  })
);
app.use(morgan(env.nodeEnv === 'test' ? 'tiny' : 'dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
