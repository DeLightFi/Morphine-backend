"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Provider Schema
 */
const PoolValueSchema = new mongoose_1.default.Schema({
    pool_address: {
        type: String,
    },
    borrowrate: {
        type: String,
    },
    totalsupply: {
        type: String,
    },
    totalassets: {
        type: String,
    },
    totalborrowed: {
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
PoolValueSchema.method({});
/**
 * @typedef PoolValue
 */
exports.default = mongoose_1.default.models.PoolValue ||
    mongoose_1.default.model('PoolValue', PoolValueSchema);
//# sourceMappingURL=poolvalue.model.js.map