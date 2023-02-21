"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = require("express");
const PoolRouter_1 = __importDefault(require("./Pool/PoolRouter"));
const MulticallRouter_1 = __importDefault(require("./Multicall/MulticallRouter"));
const DripRouter_1 = __importDefault(require("./Drip/DripRouter"));
class MasterRouter {
    get router() {
        return this._router;
    }
    constructor() {
        this._router = (0, express_1.Router)();
        this._subrouterPool = PoolRouter_1.default;
        this._subrouterMulticall = MulticallRouter_1.default;
        this._subrouterDrip = DripRouter_1.default;
        this._configure();
    }
    /**
     * Connect routes to their matching routers.
     */
    _configure() {
        this._router.use('/pool', this._subrouterPool);
        this._router.use('/multicall', this._subrouterMulticall);
        this._router.use('/drip', this._subrouterDrip);
    }
}
module.exports = new MasterRouter().router;
//# sourceMappingURL=MasterRouter.js.map