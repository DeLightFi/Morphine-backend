import { NextFunction, Request, Response, Router } from 'express';
import DripController from '../../controllers/DripController';

class DripRouter {
  private _router = Router();
  private _controller = DripController;

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
    this._router.get('/active', this._controller.get_all_activedrip);
    this._router.get('/:owner/:pool', this._controller.get_all_dripvalues);
  }
}

export = new DripRouter().router;