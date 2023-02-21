"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Provider Schema
 */
const ActiveDripSchema = new mongoose_1.default.Schema({
    block: {
        type: String,
    },
    drip_address: {
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
ActiveDripSchema.method({});
/**
 * @typedef ActiveDrip
 */
exports.default = mongoose_1.default.models.ActiveDrip ||
    mongoose_1.default.model('ActiveDrip', ActiveDripSchema);
//# sourceMappingURL=activedrip.model.js.map