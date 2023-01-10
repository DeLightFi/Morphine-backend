import { NextFunction, Request, Response, Router } from 'express';
import PoolController from '../../controllers/PoolController';

class PoolRouter {
  private _router = Router();
  private _controller = PoolController;

  get router() {
    return this._router;
  }

  constructor() {
    this._configure();
  }

  /**
   * Connect routes to their matching controller endpoints.
   */
  private _configure() {
    this._router.get('/:address', this._controller.GetData);
  }
}

export = new PoolRouter().router;