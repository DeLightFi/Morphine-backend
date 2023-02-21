"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const ErrorHandler_1 = __importDefault(require("../models/ErrorHandler"));
const activedrip_model_1 = __importDefault(require("../schema/activedrip.model"));
class DripController {
    defaultMethod() {
        throw new ErrorHandler_1.default(501, 'Not implemented method');
    }
    async get_all_activedrip(req, res) {
        //@ts-ignore
        const data = await activedrip_model_1.default.find({ drip_address: { "$ne": "last_block_index" }, active: true });
        res.json({ data: data });
    }
}
module.exports = new DripController();
//# sourceMappingURL=DripController.js.map