import { NextFunction, Request, Response, Router } from 'express';
import MulticallController from '../../controllers/MulticallController';

class MulticallRouter {
  private _router = Router();
  private _controller = MulticallController;

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
    this._router.get('/:pooladdress/events', this._controller.get_all_multicallevents);
  }
}

export = new MulticallRouter().router;