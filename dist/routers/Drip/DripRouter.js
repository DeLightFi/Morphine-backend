"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = require("express");
const DripController_1 = __importDefault(require("../../controllers/DripController"));
class DripRouter {
    get router() {
        return this._router;
    }
    constructor() {
        this._router = (0, express_1.Router)();
        this._controller = DripController_1.default;
        this._configure();
    }
    /**
     * Connect routes to their matching controller endpoints.
     */
    _configure() {
        this._router.get('/active', this._controller.get_all_activedrip);
        this._router.get('/:owner/:pool', this._controller.get_all_dripvalues);
    }
}
module.exports = new DripRouter().router;
//# sourceMappingURL=DripRouter.js.map