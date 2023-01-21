"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const ErrorHandler_1 = __importDefault(require("../models/ErrorHandler"));
const multicallevent_model_1 = __importDefault(require("../schema/multicallevent.model"));
class MulticallController {
    defaultMethod() {
        throw new ErrorHandler_1.default(501, 'Not implemented method');
    }
    async get_all_multicallevents(req, res) {
        const { pooladdress } = req.params;
        //@ts-ignore
        const data = await multicallevent_model_1.default.find({ pool_address: pooladdress.toLowerCase() });
        res.json({ data: data });
    }
}
module.exports = new MulticallController();
//# sourceMappingURL=MulticallController.js.map