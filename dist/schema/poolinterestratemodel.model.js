"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Provider Schema
 */
const PoolInterestRateModelSchema = new mongoose_1.default.Schema({
    pool_address: {
        type: String,
    },
    interestratemodel_address: {
        type: String,
    },
    optimal: {
        type: String,
    },
    baserate: {
        type: String,
    },
    slope1: {
        type: String,
    },
    slope2: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});
/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
/**
 * Methods
 */
PoolInterestRateModelSchema.method({});
/**
 * @typedef PoolInterestRateModel
 */
exports.default = mongoose_1.default.models.PoolInterestRateModel ||
    mongoose_1.default.model('PoolInterestRateModel', PoolInterestRateModelSchema);
//# sourceMappingURL=poolinterestratemodel.model.js.map