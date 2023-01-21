"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Provider Schema
 */
const MulticallEventSchema = new mongoose_1.default.Schema({
    tx: {
        type: String,
    },
    pool_address: {
        type: String,
    },
    id_address: {
        type: String,
    },
    block: {
        type: String,
    },
    borrower: {
        type: String,
    },
    payload: {
        type: mongoose_1.default.Schema.Types.Mixed,
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
MulticallEventSchema.method({});
/**
 * @typedef MulticallEvent
 */
exports.default = mongoose_1.default.models.MulticallEvent ||
    mongoose_1.default.model('MulticallEvent', MulticallEventSchema);
//# sourceMappingURL=multicallevent.model.js.map