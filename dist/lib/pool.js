"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolValuesFetcher = exports.PoolEventsFetcher = void 0;
const protocol_1 = require("@apibara/protocol");
const starknet_1 = require("@apibara/starknet");
const bn_js_1 = __importDefault(require("bn.js"));
const poolevent_model_1 = __importDefault(require("../schema/poolevent.model"));
const poolvalue_model_1 = __importDefault(require("../schema/poolvalue.model"));
const starknet_2 = require("starknet");
const mapping_1 = require("./mapping");
const pool_json_1 = __importDefault(require("./abi/pool.json"));
function uint256FromBytes(low, high) {
    const lowB = new bn_js_1.default(low);
    const highB = new bn_js_1.default(high);
    return highB.shln(128).add(lowB);
}
// Use apibara to fetch blockchain events, then decode if these 
// events are pool events, and if there are in the mapping
class PoolEventsFetcher {
    constructor(indexerId, url) {
        this.defaultblock = 36875;
        this.shouldStop = false;
        this.indexerId = indexerId;
        this.client = new protocol_1.NodeClient(url, protocol_1.credentials.createSsl());
    }
    async run() {
        //@ts-ignore
        const last_poolevent = await poolevent_model_1.default.findOne({}, {}, { sort: { 'date': -1 } });
        var start_block = this.defaultblock;
        if (last_poolevent) {
            start_block = parseInt(last_poolevent.block);
        }
        const messages = this.client.streamMessages({
            startingSequence: start_block
        });
        return new Promise((resolve, reject) => {
            messages.on('data', (message) => {
                this.handleData(message);
                if (this.shouldStop) {
                    resolve(undefined);
                }
            });
            messages.on('error', reject);
            messages.on('end', resolve);
        });
    }
    async handleData(message) {
        if (message.data) {
            if (!message.data.data.value) {
                throw new Error("received invalid data");
            }
            const block = starknet_1.Block.decode(message.data.data.value);
            await this.handleBlock(block);
        }
        else if (message.invalidate) {
            console.log(message.invalidate);
        }
    }
    async handleBlock(block) {
        for (let receipt of block.transactionReceipts) {
            if ((Date.now() - block.timestamp.getTime()) / 1000 <= 150) {
                this.shouldStop = true;
                return;
            }
            await this.handleTransaction(block, receipt);
        }
    }
    async handleTransaction(block, receipt) {
        let i = 0;
        for (let event of receipt.events) {
            let t_address;
            let t_key;
            for (let mapping_address of mapping_1.PoolMapping.address) {
                if ((0, protocol_1.hexToBuffer)(mapping_address, 32).equals(event.fromAddress)) {
                    t_address = mapping_address;
                    continue;
                }
            }
            if (!t_address) {
                i += 1;
                continue;
            }
            for (let mapping_key of mapping_1.PoolMapping.key) {
                if ((0, protocol_1.hexToBuffer)(starknet_2.hash.getSelectorFromName(mapping_key), 32).equals(event.keys[0])) {
                    t_key = mapping_key;
                    continue;
                }
            }
            if (!t_key) {
                i += 1;
                continue;
            }
            let from_;
            let to;
            let amount;
            if ((0, protocol_1.hexToBuffer)(starknet_2.hash.getSelectorFromName("Borrow"), 32).equals(event.keys[0])) {
                from_ = (0, protocol_1.bufferToHex)(Buffer.from(event.data[0]));
                to = (0, protocol_1.bufferToHex)(Buffer.from(event.data[0]));
                amount = uint256FromBytes(Buffer.from(event.data[1]), Buffer.from(event.data[2]));
            }
            else if ((0, protocol_1.hexToBuffer)(starknet_2.hash.getSelectorFromName("RepayDebt"), 32).equals(event.keys[0])) {
                from_ = "0x0";
                to = "0x0"; // TODO: change it to pool address
                amount = uint256FromBytes(Buffer.from(event.data[0]), Buffer.from(event.data[1]));
            }
            else {
                from_ = (0, protocol_1.bufferToHex)(Buffer.from(event.data[0]));
                to = (0, protocol_1.bufferToHex)(Buffer.from(event.data[1]));
                amount = uint256FromBytes(Buffer.from(event.data[2]), Buffer.from(event.data[3]));
            }
            //@ts-ignore
            await poolevent_model_1.default.findOneAndUpdate({
                event_id: `${(0, protocol_1.bufferToHex)(Buffer.from(receipt.transactionHash))}_${i}`
            }, {
                event_id: `${(0, protocol_1.bufferToHex)(Buffer.from(receipt.transactionHash))}_${i}`,
                block: block.blockNumber,
                pool_address: t_address.toLowerCase(),
                event_name: t_key,
                from: from_.toLowerCase(),
                to: to.toLowerCase(),
                amount: amount,
                date: block.timestamp
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
            i += 1;
        }
    }
}
exports.PoolEventsFetcher = PoolEventsFetcher;
// borrowrate / supplyrate / totalassets /  totalborrows --> hourly
class PoolValuesFetcher {
    constructor() {
        // init
        this.provider = new starknet_2.Provider({ sequencer: { network: 'goerli-alpha-2' } });
    }
    async CallContract(pooladdress) {
        const poolContract = new starknet_2.Contract(pool_json_1.default, pooladdress, this.provider);
        const borrowrate = await poolContract.call("borrowRate");
        const totalsupply = await poolContract.call("totalSupply");
        const totalassets = await poolContract.call("totalAssets");
        const totalborrowed = await poolContract.call("totalBorrowed");
        //@ts-ignore
        const newpoolvalue = new poolvalue_model_1.default({
            pool_address: pooladdress.toLowerCase(),
            borrowrate: uint256FromBytes(borrowrate[0].low, borrowrate[0].high).toString(),
            totalsupply: uint256FromBytes(totalsupply[0].low, totalsupply[0].high).toString(),
            totalassets: uint256FromBytes(totalassets[0].low, totalassets[0].high).toString(),
            totalborrowed: uint256FromBytes(totalborrowed[0].low, totalborrowed[0].high).toString(),
            date: Date.now()
        });
        await newpoolvalue.save();
    }
    async PoolIterations() {
        for (let pool_address of mapping_1.PoolMapping.address) {
            await this.CallContract(pool_address.toLowerCase());
        }
    }
}
exports.PoolValuesFetcher = PoolValuesFetcher;
//# sourceMappingURL=pool.js.map