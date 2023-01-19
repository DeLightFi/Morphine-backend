"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Provider Schema
 */
const PoolEventSchema = new mongoose_1.default.Schema({
    event_id: {
        type: String,
    },
    block: {
        type: String,
    },
    pool_address: {
        type: String,
    },
    event_name: {
        type: String,
    },
    from: {
        type: String,
    },
    to: {
        type: String,
    },
    amount: {
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
PoolEventSchema.method({});
/**
 * @typedef PoolEvent
 */
exports.default = mongoose_1.default.models.PoolEvent ||
    mongoose_1.default.model('PoolEvent', PoolEventSchema);
//# sourceMappingURL=poolevent.model.js.map