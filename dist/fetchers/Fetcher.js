"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uint256FromBytes = exports.uint256FromFields = exports.timeoutWrapper = exports.delay = void 0;
const protocol_1 = require("@apibara/protocol");
const starknet_1 = require("@apibara/starknet");
const starknet_2 = require("starknet");
const bn_js_1 = __importDefault(require("bn.js"));
const delay = (ms, value) => new Promise(resolve => {
    setTimeout(resolve, ms, value);
});
exports.delay = delay;
async function* timeoutWrapper(asyncIterable, timeoutDuration) {
    const TIMEOUT_VALUE = { isTimeout: true };
    const it = asyncIterable[Symbol.asyncIterator]();
    try {
        while (true) {
            const result = await Promise.race([
                it.next(),
                (0, exports.delay)(timeoutDuration, TIMEOUT_VALUE)
            ]);
            if (result.isTimeout) {
                throw new Error(`Timeout after ${timeoutDuration}ms`);
            }
            else if (result.done) {
                break;
            }
            else {
                yield result.value;
            }
        }
    }
    finally {
        it.return?.();
    }
}
exports.timeoutWrapper = timeoutWrapper;
const uint256FromFields = (low, high) => {
    const lowB = new bn_js_1.default(starknet_1.FieldElement.toHex(low).substring(2), "hex");
    const highB = new bn_js_1.default(starknet_1.FieldElement.toHex(high).substring(2), "hex");
    return highB.shln(128).add(lowB);
};
exports.uint256FromFields = uint256FromFields;
const uint256FromBytes = (low, high) => {
    const lowB = new bn_js_1.default(low);
    const highB = new bn_js_1.default(high);
    return highB.shln(128).add(lowB);
};
exports.uint256FromBytes = uint256FromBytes;
class Fetcher {
    constructor(indexerId, url, startBlock) {
        this.indexerId = indexerId;
        this.client = new protocol_1.StreamClient({ url });
        this.cursor = starknet_1.StarkNetCursor.createWithBlockNumber(startBlock);
    }
    getSelectorsToEventnames(eventNames) {
        const selectors = {};
        for (let eventName of eventNames) {
            // keep track of selector => eventName
            const selector = starknet_2.hash.getSelectorFromName(eventName);
            const selector64 = (0, starknet_2.addAddressPadding)(selector);
            selectors[selector64] = eventName;
        }
        return selectors;
    }
    getClientIterator(timeoutMs = 10000) {
        if (timeoutMs && timeoutMs > 0) {
            return timeoutWrapper(this.client, timeoutMs);
        }
        return this.client;
    }
    async run() {
        console.log("override me");
    }
}
exports.default = Fetcher;
//# sourceMappingURL=Fetcher.js.map