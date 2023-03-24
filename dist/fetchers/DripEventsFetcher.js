"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const protocol_1 = require("@apibara/protocol");
const starknet_1 = require("@apibara/starknet");
const multicallevent_model_1 = __importDefault(require("../schema/multicallevent.model"));
const starknet_2 = require("starknet");
const Fetcher_1 = __importDefault(require("./Fetcher"));
const config_1 = __importDefault(require("../config"));
class DripEventsFetcher extends Fetcher_1.default {
    constructor(url, dripTransits, startBlock = 51707) {
        super(DripEventsFetcher.name, url, startBlock);
        this.selectorToEventName = {};
        this.dripTransits = [];
        this.dripTransits = dripTransits;
        this.selectorToEventName = this.getSelectorsToEventnames([...config_1.default.fetchers.dripEvents.eventNames, ...config_1.default.fetchers.multicall.eventNames]);
        this.initFilter();
    }
    initFilter() {
        const { eventNames } = config_1.default.fetchers.dripEvents;
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
        const lastMulticallEvent = await multicallevent_model_1.default.findOne({}, {}, { sort: { 'block': -1 } });
        // start from last event blocknumber
        if (lastMulticallEvent) {
            this.cursor = starknet_1.StarkNetCursor.createWithBlockNumber(parseInt(lastMulticallEvent.block) + 1);
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
                console.log(DripEventsFetcher.name, e.message);
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
            if (eventName === "MultiCallStarted") {
                const borrower = starknet_1.FieldElement.toHex(event.event.data[0]);
                const payloads = await this.getPayloadsFromReceiptEvent(event.receipt.events);
                const dripTransitInfos = this.dripTransits.find(i => i.dtaddress === emitterAddress);
                const eventUpdate = {
                    tx: transactionHash,
                    pool_address: dripTransitInfos.pool,
                    drip: emitterAddress,
                    block: blockNumber,
                    borrower,
                    payload: payloads,
                    date,
                };
                // console.log("-----------------------------")
                // console.log(eventUpdate)
                //@ts-ignore
                await multicallevent_model_1.default.findOneAndUpdate({
                    tx: eventUpdate.tx
                }, eventUpdate, { upsert: true, new: true, setDefaultsOnInsert: true });
            }
        }
    }
    async getPayloadsFromReceiptEvent(receipt) {
        const payloads = [];
        let i = 0;
        let isInMulticall = false;
        let borrower = undefined;
        for (let event of receipt) {
            const eventNameSelector = starknet_1.FieldElement.toHex(event.keys[0]);
            const eventName = this.selectorToEventName[eventNameSelector] || 'Unknown';
            if (eventName === "MultiCallStarted") {
                // start adding payload
                isInMulticall = true;
                borrower = starknet_1.FieldElement.toHex(event.data[0]);
            }
            else if (eventName === "MultiCallFinished") {
                // return payload
                return payloads;
            }
            else if (isInMulticall) {
                // add multicall payloads
                payloads.push({
                    id: i,
                    tx_id: i,
                    name: eventName,
                    data: event.data,
                    address: (0, starknet_2.addAddressPadding)(starknet_1.FieldElement.toHex(event.fromAddress))
                });
                i++;
            }
        }
        return payloads;
    }
}
exports.default = DripEventsFetcher;
//# sourceMappingURL=DripEventsFetcher.js.map