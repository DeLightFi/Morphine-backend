"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const starknet_1 = require("starknet");
const pool_json_1 = __importDefault(require("../abi/pool.json"));
const dripmanager_json_1 = __importDefault(require("../abi/dripmanager.json"));
const config_1 = __importDefault(require("../config"));
class DripTransitsFetcher {
    constructor(network) {
        //@ts-ignore
        this.provider = new starknet_1.Provider({ sequencer: { network: network } });
    }
    async get() {
        const poolAddresses = config_1.default.pools.map(i => i.address);
        const drip_managers = [];
        for (let poolAddress of poolAddresses) {
            const poolContract = new starknet_1.Contract(pool_json_1.default, poolAddress, this.provider);
            const connectedDripManager = (0, starknet_1.validateAndParseAddress)(await (await poolContract.call("connectedDripManager")).dripManager.toString());
            if (connectedDripManager != '0x0000000000000000000000000000000000000000000000000000000000000000') {
                drip_managers.push({
                    pool: poolAddress,
                    dripmanager: connectedDripManager
                });
            }
        }
        const drip_transits = [];
        for (let drip_manager_address of drip_managers) {
            const dripManagerContract = new starknet_1.Contract(dripmanager_json_1.default, drip_manager_address.dripmanager, this.provider);
            const dripAddress = (0, starknet_1.validateAndParseAddress)(await (await dripManagerContract.call("dripTransit")).dripTransit.toString());
            drip_transits.push({
                pool: (0, starknet_1.validateAndParseAddress)(drip_manager_address.pool),
                dtaddress: (0, starknet_1.validateAndParseAddress)(dripAddress)
            });
        }
        return drip_transits;
    }
}
exports.default = DripTransitsFetcher;
//# sourceMappingURL=DripTransitsFetcher.js.map