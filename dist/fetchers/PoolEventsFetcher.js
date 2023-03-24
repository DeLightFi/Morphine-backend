"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("@apibara/protocol");
const starknet_1 = require("@apibara/starknet");
const poolevent_model_1 = __importDefault(require("../schema/poolevent.model"));
const starknet_2 = require("starknet");
const Fetcher_1 = __importStar(require("./Fetcher"));
const config_1 = __importDefault(require("../config"));
class PoolEventsFetcher extends Fetcher_1.default {
    constructor(url, startBlock = 36875) {
        super(PoolEventsFetcher.name, url, startBlock);
        this.selectorToEventName = {};
        this.selectorToEventName = this.getSelectorsToEventnames(config_1.default.fetchers.poolEvents.eventNames);
        this.initFilter();
    }
    initFilter() {
        const { eventNames } = config_1.default.fetchers.poolEvents;
        const poolAddresses = config_1.default.pools.map(i => i.address);
        const filterBuilder = starknet_1.Filter.create()
            .withHeader({ weak: true });
        for (let poolAddress of poolAddresses) {
            for (let eventName of eventNames) {
                const selector = starknet_2.hash.getSelectorFromName(eventName);
                // add filter for poolAddress / eventName
                filterBuilder.addEvent((e) => e
                    .withFromAddress(starknet_1.FieldElement.fromBigInt(poolAddress))
                    .withKeys([starknet_1.FieldElement.fromBigInt(selector)]));
            }
        }
        this.filter = filterBuilder.encode();
    }
    async run() {
        //@ts-ignore
        const lastPoolEvent = await poolevent_model_1.default.findOne({}, {}, { sort: { 'block': -1 } });
        // start from last event blocknumber
        if (lastPoolEvent) {
            this.cursor = starknet_1.StarkNetCursor.createWithBlockNumber(parseInt(lastPoolEvent.block) + 1);
        }
        await this.client.configure({
            filter: this.filter,
            batchSize: 100,
            finality: protocol_1.v1alpha2.DataFinality.DATA_STATUS_FINALIZED,
            cursor: this.cursor
        });
        try {
            // start looping on messages
            for await (const message of this.getClientIterator()) {
                // console.log(`\nBatch: ${Cursor.toString(message.data.cursor)} -- ${Cursor.toString(message.data.endCursor)}`)
                await this.handleData(message);
            }
        }
        catch (e) {
            if (e instanceof Error) {
                console.log(PoolEventsFetcher.name, e.message);
            }
            else {
                console.log(e);
            }
        }
    }
    async handleData(message) {
        if (message.data?.data) {
            // loop on blocks
            for (let item of message.data.data) {
                const block = starknet_1.v1alpha2.Block.decode(item);
                await this.handleBlock(block);
            }
        }
        else if (message.invalidate) {
            console.log("invalidate : ", message.invalidate);
        }
    }
    async handleBlock(block) {
        const { header, events } = block;
        let i = 0;
        // loop on events
        for (let event of events) {
            const poolAddress = starknet_1.FieldElement.toHex(event.event.fromAddress);
            const transactionHash = starknet_1.FieldElement.toHex(event.transaction.meta.hash);
            const eventId = `${transactionHash}_${i}`;
            const blockNumber = header.blockNumber.toString();
            const date = Number(header.timestamp.seconds) * 1000;
            const eventNameSelector = starknet_1.FieldElement.toHex(event.event.keys[0]);
            const eventName = this.selectorToEventName[eventNameSelector];
            const from = starknet_1.FieldElement.toHex(event.event.data[0]);
            const to = starknet_1.FieldElement.toHex(event.event.data[1]);
            let amountIndex = 0;
            if (["Deposit", "Withdraw"].includes(eventName)) {
                amountIndex = 2;
            }
            if (["Borrow"].includes(eventName)) {
                amountIndex = 1;
            }
            if (["RepayDebt"].includes(eventName)) {
                amountIndex = 0;
            }
            const amount = (0, Fetcher_1.uint256FromFields)(event.event.data[amountIndex], event.event.data[amountIndex + 1]).toString();
            const eventUpdate = {
                blockNumber,
                transactionHash,
                eventId,
                date,
                poolAddress,
                eventName,
                from,
                to,
                amount,
            };
            console.log("-----------------------------");
            console.log(eventUpdate);
            //@ts-ignore
            await poolevent_model_1.default.findOneAndUpdate({
                event_id: eventUpdate.eventId
            }, {
                event_id: eventUpdate.eventId,
                block: eventUpdate.blockNumber,
                pool_address: eventUpdate.poolAddress,
                event_name: eventUpdate.eventName,
                from: eventUpdate.from,
                to: eventUpdate.to,
                amount: eventUpdate.amount,
                date: eventUpdate.date
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
            i++;
        }
    }
}
exports.default = PoolEventsFetcher;
//# sourceMappingURL=PoolEventsFetcher.js.map