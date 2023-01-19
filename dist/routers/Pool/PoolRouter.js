"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = require("express");
const PoolController_1 = __importDefault(require("../../controllers/PoolController"));
class PoolRouter {
    get router() {
        return this._router;
    }
    constructor() {
        this._router = (0, express_1.Router)();
        this._controller = PoolController_1.default;
        this._configure();
    }
    /**
     * Connect routes to their matching controller endpoints.
     */
    _configure() {
        this._router.get('/:pooladdress/events', this._controller.get_all_poolevents);
        this._router.get('/events/from/:walletaddress', this._controller.get_user_from_poolevents);
        this._router.get('/events/to/:walletaddress', this._controller.get_user_to_poolevents);
        this._router.get('/:pooladdress/values', this._controller.get_all_poolvalues);
    }
}
module.exports = new PoolRouter().router;
//# sourceMappingURL=PoolRouter.js.map