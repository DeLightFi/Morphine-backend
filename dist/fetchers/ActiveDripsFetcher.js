"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("@apibara/protocol");
const starknet_1 = require("@apibara/starknet");
const activedrip_model_1 = __importDefault(require("../schema/activedrip.model"));
const dripvalue_model_1 = __importDefault(require("../schema/dripvalue.model"));
const starknet_2 = require("starknet");
const Fetcher_1 = __importDefault(require("./Fetcher"));
const config_1 = __importDefault(require("../config"));
class ActiveDripsFetcher extends Fetcher_1.default {
    constructor(url, dripTransits, startBlock = 60000) {
        super(ActiveDripsFetcher.name, url, startBlock);
        this.selectorToEventName = {};
        this.dripTransits = [];
        this.selectorToEventName = this.getSelectorsToEventnames(config_1.default.fetchers.activeDrips.eventNames);
        this.dripTransits = dripTransits;
        this.initFilter();
    }
    initFilter() {
        const { eventNames } = config_1.default.fetchers.activeDrips;
        const filterBuilder = starknet_1.Filter.create()
            .withHeader({ weak: true });
        for (let dripTransit of this.dripTransits) {
            for (let eventName of eventNames) {
                const selector = starknet_2.hash.getSelectorFromName(eventName);
                // add filter for dtaddress / eventName
                filterBuilder.addEvent((e) => e
                    .withFromAddress(starknet_1.FieldElement.fromBigInt(dripTransit.dtaddress))
                    .withKeys([starknet_1.FieldElement.fromBigInt(selector)]));
            }
        }
        this.filter = filterBuilder.encode();
    }
    async run() {
        //@ts-ignore
        const lastActiveDrip = await activedrip_model_1.default.findOne({}, {}, { sort: { 'block': -1 } });
        // start from last event blocknumber
        if (lastActiveDrip) {
            this.cursor = starknet_1.StarkNetCursor.createWithBlockNumber(parseInt(lastActiveDrip.block) + 1);
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
                console.log(ActiveDripsFetcher.name, e.message);
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
        console.log("\nblock :", header.blockNumber.toString());
        // loop on events
        for (let event of events) {
            const eventNameSelector = starknet_1.FieldElement.toHex(event.event.keys[0]);
            const eventName = this.selectorToEventName[eventNameSelector];
            const emitterAddress = starknet_1.FieldElement.toHex(event.event.fromAddress);
            const transactionHash = starknet_1.FieldElement.toHex(event.transaction.meta.hash);
            const blockNumber = header.blockNumber.toString();
            const date = Number(header.timestamp.seconds) * 1000;
            if (eventName === "OpenDrip") {
                const owner = starknet_1.FieldElement.toHex(event.event.data[0]);
                const dripTransitInfos = this.dripTransits.find(i => i.dtaddress === emitterAddress);
                console.log("OpenDrip ", owner);
                //@ts-ignore
                await activedrip_model_1.default.findOneAndUpdate({
                    owner_address: owner,
                    pool_address: dripTransitInfos.pool
                }, {
                    owner_address: owner,
                    pool_address: dripTransitInfos.pool,
                    block: blockNumber,
                    date: date,
                    updated: Date.now(),
                }, { upsert: true, new: true, setDefaultsOnInsert: true });
            }
            if (eventName === "CloseDrip") {
                const to = starknet_1.FieldElement.toHex(event.event.data[1]);
                const dripTransitInfos = this.dripTransits.find(i => i.dtaddress === emitterAddress);
                console.log("CloseDrip ", to);
                //@ts-ignore
                await activedrip_model_1.default.findOneAndUpdate({
                    owner_address: to,
                    pool_address: dripTransitInfos.pool
                }, {
                    drip_address: to,
                    pool_address: dripTransitInfos.pool,
                    block: blockNumber,
                    active: false,
                    updated: Date.now(),
                }, { upsert: true, setDefaultsOnInsert: true });
                //@ts-ignore
                await dripvalue_model_1.default.deleteMany({
                    owner: to,
                    pool: dripTransitInfos.pool
                });
            }
        }
    }
}
exports.default = ActiveDripsFetcher;
//# sourceMappingURL=ActiveDripsFetcher.js.map