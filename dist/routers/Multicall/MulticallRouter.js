"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = require("express");
const MulticallController_1 = __importDefault(require("../../controllers/MulticallController"));
class MulticallRouter {
    get router() {
        return this._router;
    }
    constructor() {
        this._router = (0, express_1.Router)();
        this._controller = MulticallController_1.default;
        this._configure();
    }
    /**
     * Connect routes to their matching controller endpoints.
     */
    _configure() {
        this._router.get('/:pooladdress/events', this._controller.get_all_multicallevents);
    }
}
module.exports = new MulticallRouter().router;
//# sourceMappingURL=MulticallRouter.js.map