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
    this._router.get('/:pooladdress/events', this._controller.get_all_poolevents);
    this._router.get('/events/from/:walletaddress', this._controller.get_user_from_poolevents);
    this._router.get('/events/to/:walletaddress', this._controller.get_user_to_poolevents);

    this._router.get('/:pooladdress/values', this._controller.get_all_poolvalues);

    this._router.get('/:pooladdress/interestratemodels', this._controller.get_all_poolinterestratemodels);
  }
}

export = new PoolRouter().router;