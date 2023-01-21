import { Router } from 'express';
import PoolRouter from './Pool/PoolRouter';
import MulticallRouter from './Multicall/MulticallRouter';

class MasterRouter {
  private _router = Router();
  private _subrouterPool = PoolRouter;
  private _subrouterMulticall = MulticallRouter;

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
    this._router.use('/multicall', this._subrouterMulticall);
  }
}

export = new MasterRouter().router;