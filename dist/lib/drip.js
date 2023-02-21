"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveDripsFetcher = void 0;
const protocol_1 = require("@apibara/protocol");
const starknet_1 = require("@apibara/starknet");
const bn_js_1 = __importDefault(require("bn.js"));
const activedrip_model_1 = __importDefault(require("../schema/activedrip.model"));
const starknet_2 = require("starknet");
const mapping_1 = require("./mapping");
const pool_json_1 = __importDefault(require("./abi/pool.json"));
const dripmanager_json_1 = __importDefault(require("./abi/dripmanager.json"));
function uint256FromBytes(low, high) {
    const lowB = new bn_js_1.default(low);
    const highB = new bn_js_1.default(high);
    return highB.shln(128).add(lowB);
}
// Use apibara to fetch blockchain events, then decode if these 
// events are pool events, and if there are in the mapping
class ActiveDripsFetcher {
    constructor(indexerId, url) {
        this.defaultblock = 51707;
        this.shouldStop = false;
        this.isinmulticall = false;
        this.provider = new starknet_2.Provider({ sequencer: { network: 'goerli-alpha-2' } });
        this.indexerId = indexerId;
        this.client = new protocol_1.NodeClient(url, protocol_1.credentials.createSsl());
    }
    async getActiveDripTransits() {
        let drip_managers = [];
        for (let mapping_address of mapping_1.PoolMapping.address) {
            const poolContract = new starknet_2.Contract(pool_json_1.default, mapping_address, this.provider);
            const connectedDripManager = (0, starknet_2.validateAndParseAddress)(await (await poolContract.call("connectedDripManager")).dripManager.toString());
            if (connectedDripManager != '0x0000000000000000000000000000000000000000000000000000000000000000') {
                drip_managers.push({ pool: mapping_address, dripmanager: connectedDripManager });
            }
        }
        let drip_transits = [];
        for (let drip_manager_address of drip_managers) {
            const dripManagerContract = new starknet_2.Contract(dripmanager_json_1.default, drip_manager_address.dripmanager, this.provider);
            const dripAddress = (0, starknet_2.validateAndParseAddress)(await (await dripManagerContract.call("dripTransit")).dripTransit.toString());
            drip_transits.push({ pool: drip_manager_address.pool, dtaddress: dripAddress });
        }
        return drip_transits;
    }
    async run(drip_transit) {
        //@ts-ignore
        const last_activedrip = await activedrip_model_1.default.findOne({}, {}, { sort: { 'date': -1 } });
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
        for (let receipt of block.transactionReceipts) {
            if ((Date.now() - block.timestamp.getTime()) / 1000 <= 150) {
                this.shouldStop = true;
                return;
            }
            await this.handleTransaction(block, receipt, drip_transit);
        }
    }
    async handleTransaction(block, receipt, drip_transit) {
        let drip_address;
        for (let event of receipt.events) {
            let t_address;
            let drip_adr = drip_transit.dtaddress;
            if ((0, protocol_1.hexToBuffer)(drip_adr, 32).equals(event.fromAddress)) {
                t_address = drip_transit.dtaddress;
                if ((0, protocol_1.hexToBuffer)(starknet_2.hash.getSelectorFromName("OpenDrip"), 32).equals(event.keys[0])) {
                    console.log(event.data);
                    //drip_address = bufferToHex(Buffer.from(event.data[0])).toLowerCase();
                }
                else if ((0, protocol_1.hexToBuffer)(starknet_2.hash.getSelectorFromName("CloseDrip"), 32).equals(event.keys[0])) {
                    console.log(event.data);
                }
            }
        }
    }
}
exports.ActiveDripsFetcher = ActiveDripsFetcher;
//# sourceMappingURL=drip.js.map