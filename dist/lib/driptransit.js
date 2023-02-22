"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DripTransitsFetcher = void 0;
const protocol_1 = require("@apibara/protocol");
const starknet_1 = require("starknet");
const mapping_1 = require("./mapping");
const pool_json_1 = __importDefault(require("./abi/pool.json"));
const dripmanager_json_1 = __importDefault(require("./abi/dripmanager.json"));
class DripTransitsFetcher {
    constructor(indexerId, url) {
        this.provider = new starknet_1.Provider({ sequencer: { network: 'goerli-alpha-2' } });
        this.indexerId = indexerId;
        this.client = new protocol_1.NodeClient(url, protocol_1.credentials.createSsl());
    }
    async get() {
        let drip_managers = [];
        for (let mapping_address of mapping_1.PoolMapping.address) {
            const poolContract = new starknet_1.Contract(pool_json_1.default, mapping_address, this.provider);
            const connectedDripManager = (0, starknet_1.validateAndParseAddress)(await (await poolContract.call("connectedDripManager")).dripManager.toString());
            if (connectedDripManager != '0x0000000000000000000000000000000000000000000000000000000000000000') {
                drip_managers.push({ pool: mapping_address, dripmanager: connectedDripManager });
            }
        }
        let drip_transits = [];
        for (let drip_manager_address of drip_managers) {
            const dripManagerContract = new starknet_1.Contract(dripmanager_json_1.default, drip_manager_address.dripmanager, this.provider);
            const dripAddress = (0, starknet_1.validateAndParseAddress)(await (await dripManagerContract.call("dripTransit")).dripTransit.toString());
            drip_transits.push({ pool: drip_manager_address.pool, dtaddress: dripAddress });
        }
        return drip_transits;
    }
}
exports.DripTransitsFetcher = DripTransitsFetcher;
//# sourceMappingURL=driptransit.js.map