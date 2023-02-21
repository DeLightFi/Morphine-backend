import { Router } from 'express';
import PoolRouter from './Pool/PoolRouter';
import MulticallRouter from './Multicall/MulticallRouter';
import DripRouter from './Drip/DripRouter';

class MasterRouter {
  private _router = Router();
  private _subrouterPool = PoolRouter;
  private _subrouterMulticall = MulticallRouter;
  private _subrouterDrip = DripRouter;

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
    this._router.use('/drip', this._subrouterDrip);
  }
}

export = new MasterRouter().router;