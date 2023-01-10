import { Router } from 'express';
import PoolRouter from './Pool/PoolRouter';

class MasterRouter {
  private _router = Router();
  private _subrouterPool = PoolRouter;

  get router() {
    return this._router;
  }

  constructor() {
    this._configure();
  }

  /**
   * Connect routes to their matching routers.
   */
  private _configure() {
    this._router.use('/pool', this._subrouterPool);
  }
}

export = new MasterRouter().router;