import {
  credentials,
  NodeClient,
} from "@apibara/protocol";
import { Provider, Contract, number, validateAndParseAddress } from "starknet";
import { PoolMapping } from "./mapping";
import pool_abi from "./abi/pool.json"
import dripmanager_abi from "./abi/dripmanager.json"


export class DripTransitsFetcher {
  private readonly client: NodeClient;
  private readonly indexerId: string;
  private provider = new Provider({ sequencer: { network: 'goerli-alpha-2' } });

  constructor(indexerId: string, url: string) {
    this.indexerId = indexerId;
    this.client = new NodeClient(url, credentials.createSsl());
  }

  async get() {

    let drip_managers = []
    for (let mapping_address of PoolMapping.address) {
      const poolContract = new Contract(pool_abi, mapping_address, this.provider);

      const connectedDripManager = validateAndParseAddress(await (await poolContract.call("connectedDripManager")).dripManager.toString());
      if (connectedDripManager != '0x0000000000000000000000000000000000000000000000000000000000000000') {
        drip_managers.push({ pool: mapping_address, dripmanager: connectedDripManager });
      }
    }

    let drip_transits = []
    for (let drip_manager_address of drip_managers) {
      const dripManagerContract = new Contract(dripmanager_abi, drip_manager_address.dripmanager, this.provider);
      const dripAddress = validateAndParseAddress(await (await dripManagerContract.call("dripTransit")).dripTransit.toString());
      drip_transits.push({ pool: drip_manager_address.pool, dtaddress: dripAddress })
    }

    return drip_transits;
  }
}
