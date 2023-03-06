"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DripValuesFetcher = exports.ActiveDripsFetcher = void 0;
const protocol_1 = require("@apibara/protocol");
const starknet_1 = require("@apibara/starknet");
const bn_js_1 = __importDefault(require("bn.js"));
const activedrip_model_1 = __importDefault(require("../schema/activedrip.model"));
const dripvalue_model_1 = __importDefault(require("../schema/dripvalue.model"));
const starknet_2 = require("starknet");
const dataprovider_json_1 = __importDefault(require("./abi/dataprovider.json"));
const mapping_1 = require("./mapping");
function uint256FromBytes(low, high) {
    const lowB = new bn_js_1.default(low);
    const highB = new bn_js_1.default(high);
    return highB.shln(128).add(lowB);
}
// Use apibara to fetch blockchain events, then decode if these 
// events are pool events, and if there are in the mapping
class ActiveDripsFetcher {
    constructor(indexerId, url) {
        this.defaultblock = 60000;
        this.shouldStop = false;
        this.indexerId = indexerId;
        this.client = new protocol_1.NodeClient(url, protocol_1.credentials.createSsl());
    }
    async run(drip_transit) {
        //@ts-ignore
        const last_activedrip = await activedrip_model_1.default.findOne({ pool_address: drip_transit.pool }, {}, { sort: { 'date': -1 } });
        var start_block = this.defaultblock;
        if (last_activedrip) {
            start_block = parseInt(last_activedrip.block);
        }
        const messages = this.client.streamMessages({
            startingSequence: start_block
        });
        return new Promise((resolve, reject) => {
            messages.on('data', (message) => {
                this.handleData(message, drip_transit);
                if (this.shouldStop) {
                    resolve(undefined);
                }
            });
            messages.on('error', reject);
            messages.on('end', resolve);
        });
    }
    async handleData(message, drip_transit) {
        if (message.data) {
            if (!message.data.data.value) {
                throw new Error("received invalid data");
            }
            const block = starknet_1.Block.decode(message.data.data.value);
            await this.handleBlock(block, drip_transit);
        }
        else if (message.invalidate) {
            console.log(message.invalidate);
        }
    }
    async handleBlock(block, drip_transit) {
        if ((Date.now() - block.timestamp.getTime()) / 1000 <= 500) {
            //@ts-ignore
            await activedrip_model_1.default.findOneAndUpdate({
                owner_address: "last_block_index",
                pool_address: drip_transit.pool
            }, {
                owner_address: "last_block_index",
                pool_address: drip_transit.pool,
                block: block.blockNumber,
                active: false,
                date: block.timestamp,
                updated: block.timestamp,
            }, { upsert: true, new: true, setDefaultsOnInsert: true });
            this.shouldStop = true;
            return;
        }
        else {
            for (let receipt of block.transactionReceipts) {
                await this.handleTransaction(block, receipt, drip_transit);
            }
        }
    }
    async handleTransaction(block, receipt, drip_transit) {
        for (let event of receipt.events) {
            let t_address;
            let drip_adr = drip_transit.dtaddress;
            if ((0, protocol_1.hexToBuffer)(drip_adr, 32).equals(event.fromAddress)) {
                t_address = drip_transit.dtaddress;
                if ((0, protocol_1.hexToBuffer)(starknet_2.hash.getSelectorFromName("OpenDrip"), 32).equals(event.keys[0])) {
                    console.log("OpenDrip");
                    let owner = (0, protocol_1.bufferToHex)(Buffer.from(event.data[0])).toLowerCase();
                    console.log("owner", owner);
                    //@ts-ignore
                    await activedrip_model_1.default.findOneAndUpdate({
                        owner_address: owner,
                        pool_address: drip_transit.pool
                    }, {
                        owner_address: owner,
                        pool_address: drip_transit.pool,
                        block: block.blockNumber,
                        date: block.timestamp,
                        updated: block.timestamp,
                    }, { upsert: true, new: true, setDefaultsOnInsert: true });
                }
                else if ((0, protocol_1.hexToBuffer)(starknet_2.hash.getSelectorFromName("CloseDrip"), 32).equals(event.keys[0])) {
                    console.log("CloseDrip");
                    let to = (0, protocol_1.bufferToHex)(Buffer.from(event.data[1])).toLowerCase();
                    console.log("to", to);
                    //@ts-ignore
                    await activedrip_model_1.default.findOneAndUpdate({
                        owner_address: to,
                        pool_address: drip_transit.pool
                    }, {
                        drip_address: to,
                        pool_address: drip_transit.pool,
                        block: block.blockNumber,
                        active: false,
                        updated: block.timestamp,
                    }, { upsert: true, setDefaultsOnInsert: true });
                    //@ts-ignore
                    await dripvalue_model_1.default.deleteMany({
                        owner: to,
                        pool: drip_transit.pool
                    });
                }
            }
        }
    }
}
exports.ActiveDripsFetcher = ActiveDripsFetcher;
class DripValuesFetcher {
    constructor() {
        // init
        this.provider = new starknet_2.Provider({ sequencer: { network: 'goerli-alpha-2' } });
    }
    async CallContract(activedrip) {
        const poolContract = new starknet_2.Contract(dataprovider_json_1.default, mapping_1.DataProviderMapping.contract_address, this.provider);
        const info = await poolContract.getUserDripInfoFromPool(mapping_1.RegistryMapping.contract_address, activedrip.owner, activedrip.pool);
        //@ts-ignore
        const newdripvalue = new dripvalue_model_1.default({
            owner: activedrip.owner.toLowerCase(),
            pool: activedrip.pool.toLowerCase(),
            user_balance: uint256FromBytes(info.DripFullInfo.user_balance.low, info.DripFullInfo.user_balance.high).toString(),
            total_balance: uint256FromBytes(info.DripFullInfo.total_balance.low, info.DripFullInfo.total_balance.high).toString(),
            total_weighted_balance: uint256FromBytes(info.DripFullInfo.total_weighted_balance.low, info.DripFullInfo.total_weighted_balance.high).toString(),
            debt: uint256FromBytes(info.DripFullInfo.debt.low, info.DripFullInfo.debt.high).toString(),
            health_factor: uint256FromBytes(info.DripFullInfo.health_factor.low, info.DripFullInfo.health_factor.high).toString(),
            date: Date.now()
        });
        await newdripvalue.save();
    }
    async DripIterations() {
        //@ts-ignore
        const activedrips = await activedrip_model_1.default.find({ owner_address: { "$ne": "last_block_index" }, active: true });
        for (let activedrip of activedrips) {
            await this.CallContract({ owner: activedrip.owner_address, pool: activedrip.pool_address });
        }
    }
}
exports.DripValuesFetcher = DripValuesFetcher;
//# sourceMappingURL=drip.js.map