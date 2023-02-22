"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Provider Schema
 */
const DripValueSchema = new mongoose_1.default.Schema({
    owner: {
        type: String,
    },
    pool: {
        type: String,
    },
    user_balance: {
        type: String,
    },
    total_balance: {
        type: String,
    },
    total_weighted_balance: {
        type: String,
    },
    debt: {
        type: String,
    },
    health_factor: {
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
DripValueSchema.method({});
/**
 * @typedef DripValue
 */
exports.default = mongoose_1.default.models.DripValue ||
    mongoose_1.default.model('DripValue', DripValueSchema);
//# sourceMappingURL=dripvalue.model.js.map