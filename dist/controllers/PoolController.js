"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const ErrorHandler_1 = __importDefault(require("../models/ErrorHandler"));
const poolevent_model_1 = __importDefault(require("../schema/poolevent.model"));
const poolvalue_model_1 = __importDefault(require("../schema/poolvalue.model"));
class PoolController {
    defaultMethod() {
        throw new ErrorHandler_1.default(501, 'Not implemented method');
    }
    async get_all_poolevents(req, res) {
        const { pooladdress } = req.params;
        //@ts-ignore
        const data = await poolevent_model_1.default.find({ pool_address: pooladdress.toLowerCase() });
        res.json({ data: data });
    }
    async get_user_from_poolevents(req, res) {
        const { walletaddress } = req.params;
        //@ts-ignore
        const data = await poolevent_model_1.default.find({ from: walletaddress.toLowerCase() });
        res.json({ data: data });
    }
    async get_user_to_poolevents(req, res) {
        const { walletaddress } = req.params;
        //@ts-ignore
        const data = await poolevent_model_1.default.find({ to: walletaddress.toLowerCase() });
        res.json({ data: data });
    }
    async get_all_poolvalues(req, res) {
        const { pooladdress } = req.params;
        //@ts-ignore
        const data = await poolvalue_model_1.default.find({ pool_address: pooladdress.toLowerCase() });
        res.json({ data: data });
    }
}
module.exports = new PoolController();
//# sourceMappingURL=PoolController.js.map