
import { Provider, Contract, number, validateAndParseAddress } from "starknet";
import pool_abi from "../abi/pool.json"
import dripmanager_abi from "../abi/dripmanager.json"
import config from "../config"

export default class DripTransitsFetcher {
  private provider: Provider;

  constructor(network: string) {
    //@ts-ignore
    this.provider = new Provider({ sequencer: { network: network } });
  }

  async get() {

    const poolAddresses = config.pools.map(i=> i.address)

    const drip_managers = []
    for (let poolAddress of poolAddresses) {
      const poolContract = new Contract(pool_abi, poolAddress, this.provider);
      const connectedDripManager = validateAndParseAddress(
        await (await poolContract.call("connectedDripManager")).dripManager.toString()
      );
      if (connectedDripManager != '0x0000000000000000000000000000000000000000000000000000000000000000') {
        drip_managers.push({
          pool: poolAddress,
          dripmanager: connectedDripManager
        });
      }
    }

    const drip_transits = []
    for (let drip_manager_address of drip_managers) {
      const dripManagerContract = new Contract(dripmanager_abi, drip_manager_address.dripmanager, this.provider);
      const dripAddress = validateAndParseAddress(
        await (await dripManagerContract.call("dripTransit")).dripTransit.toString()
      );
      drip_transits.push({
        pool: validateAndParseAddress(drip_manager_address.pool),
        dtaddress: validateAndParseAddress(dripAddress)
      })
    }

    return drip_transits;
  }
}
