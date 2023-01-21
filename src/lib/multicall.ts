import {
  credentials,
  NodeClient,
  proto,
  hexToBuffer,
  bufferToHex,
} from "@apibara/protocol";
import { Block, TransactionReceipt } from "@apibara/starknet";
import BN from "bn.js";
import MulticallEvent from "../schema/multicallevent.model";
import { hash, Provider, Contract, json, validateAndParseAddress } from "starknet";
import { PoolMapping, DripMapping } from "./mapping";
import pool_abi from "./abi/pool.json"
import dripmanager_abi from "./abi/dripmanager.json"


function uint256FromBytes(low: Buffer, high: Buffer): BN {
  const lowB = new BN(low);
  const highB = new BN(high);
  return highB.shln(128).add(lowB);
}


// Use apibara to fetch blockchain events, then decode if these 
// events are pool events, and if there are in the mapping
export class DripEventsFetcher {
  private readonly client: NodeClient;
  private readonly indexerId: string;
  private defaultblock: number = 51707;
  private shouldStop: boolean = false;
  private isinmulticall: boolean = false;
  private provider = new Provider({ sequencer: { network: 'goerli-alpha-2' } });

  constructor(indexerId: string, url: string) {
    this.indexerId = indexerId;
    this.client = new NodeClient(url, credentials.createSsl());
  }

  async getCurrentDrips() {

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
      drip_transits.push({ pool: drip_manager_address.pool, driptransit: dripAddress })
    }

    return drip_transits;
  }

  async run(drip_transit: { pool: string, driptransit: string }) {
    //@ts-ignore
    const last_multicallevent = await MulticallEvent.findOne({}, {}, { sort: { 'date': -1 } });
    var start_block = this.defaultblock;
    if (last_multicallevent) {
      start_block = parseInt(last_multicallevent.block);
    }

    const messages = this.client.streamMessages(
      {
        startingSequence: start_block
      }
    );

    return new Promise((resolve, reject) => {
      messages.on('data', (message) => {
        this.handleData(message, drip_transit);
        if (this.shouldStop) {
          resolve(undefined);
        }
      })
      messages.on('error', reject)
      messages.on('end', resolve)
    })
  }

  async handleData(message: proto.StreamMessagesResponse__Output, drip_transit: { pool: string, driptransit: string }) {
    if (message.data) {
      if (!message.data.data.value) {
        throw new Error("received invalid data");
      }
      const block = Block.decode(message.data.data.value);
      await this.handleBlock(block, drip_transit);
    } else if (message.invalidate) {
      console.log(message.invalidate);
    }
  }

  async handleBlock(block: Block, drip_transit: { pool: string, driptransit: string }) {
    for (let receipt of block.transactionReceipts) {
      if ((Date.now() - block.timestamp.getTime()) / 1000 <= 150) {
        this.shouldStop = true;
        return;
      }
      await this.handleTransaction(block, receipt, drip_transit);
    }
  }

  async handleTransaction(
    block: Block,
    receipt: TransactionReceipt,
    drip_transit: { pool: string, driptransit: string }
  ) {
    let i: number = 0;
    let borrower: string;
    let payload: { name: string, tx_id: string, data: Uint8Array[] }[] = [];
    for (let event of receipt.events) {
      let t_address: string;
      let t_key: string;
      let drip_adr = drip_transit.driptransit;
      if (hexToBuffer(drip_adr, 32).equals(event.fromAddress)) {
        t_address = drip_transit.driptransit;
        if (hexToBuffer(hash.getSelectorFromName("MultiCallStarted"), 32).equals(event.keys[0])) {
          this.isinmulticall = true;
          borrower = bufferToHex(Buffer.from(event.data[0])).toLowerCase();
        }
      }

      if (this.isinmulticall) {
        if (hexToBuffer(hash.getSelectorFromName("MultiCallFinished"), 32).equals(event.keys[0])) {
          this.isinmulticall = false;

          //@ts-ignore
          await MulticallEvent.findOneAndUpdate(
            {
              tx: bufferToHex(Buffer.from(receipt.transactionHash))
            },
            {
              tx: bufferToHex(Buffer.from(receipt.transactionHash)),
              pool_address: drip_transit.pool,
              drip: drip_transit.driptransit,
              block: block.blockNumber,
              borrower: borrower,
              payload: payload,
              date: block.timestamp
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )

        }
        else {
          for (let dripkey of DripMapping.key) {
            if (hexToBuffer(hash.getSelectorFromName(dripkey), 32).equals(event.keys[0])) {
              t_key = dripkey;
              break;
            }
          }
          if (!t_key) {
            t_key = "Undefined"
          }
          if (t_key != 'MultiCallStarted') {
            let eventdata = event?.data;
            if (!eventdata) {
              eventdata = [new Uint8Array([])]
            }
            payload.push({ name: t_key, tx_id: `${bufferToHex(Buffer.from(receipt.transactionHash))}_${i}`, data: eventdata });
          }
        }
      }
      i += 1;
    }
  }
}