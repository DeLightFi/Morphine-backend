import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import * as mongoose from 'mongoose';
import cors from 'cors';

import job from './jobs/job';
import MasterRouter from './routers/MasterRouter';
import ErrorHandler from './models/ErrorHandler';

// load the environment variables from the .env file
dotenv.config({
  path: '.env'
});

/**
 * Express server application class.
 * @description Will later contain the routing system.
 */
class Server {
  public app = express();
  public router = MasterRouter;
}
const server = new Server();

mongoose
  .connect(process.env.MONGODB_URI || 'none')
  .then(async connection => {
    server.app.use(cors({ origin: "http://localhost:3000" }))

    server.app.use('/api', server.router);

    server.app.use((err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
      res.status(err.statusCode || 500).json({
        status: 'error',
        statusCode: err.statusCode,
        message: err.message
      });
    });

    ((port = process.env.APP_PORT || 5000) => {
      server.app.listen(port, () => {
        console.log(("App is running at http://localhost:%d in %s mode"), port, process.env.NODE_ENV);
        console.log("Press CTRL-C to stop\n");
        job.PoolEvents();
        job.PoolValues();
      });

      server.app.on('close', () => {
        server.app.removeAllListeners();
      });
    })();
  })
  .catch(error => console.log(error));
