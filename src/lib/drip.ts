import {
  credentials,
  NodeClient,
  proto,
  hexToBuffer,
  bufferToHex,
} from "@apibara/protocol";
import { Block, TransactionReceipt } from "@apibara/starknet";
import BN from "bn.js";
import ActiveDrip from "../schema/activedrip.model";
import { hash, Provider, Contract, number, validateAndParseAddress } from "starknet";
import { PoolMapping } from "./mapping";
import pool_abi from "./abi/pool.json"
import dripmanager_abi from "./abi/dripmanager.json"


function uint256FromBytes(low: Buffer, high: Buffer): BN {
  const lowB = new BN(low);
  const highB = new BN(high);
  return highB.shln(128).add(lowB);
}


// Use apibara to fetch blockchain events, then decode if these 
// events are pool events, and if there are in the mapping
export class ActiveDripsFetcher {
  private readonly client: NodeClient;
  private readonly indexerId: string;
  private defaultblock: number = 60000;
  private shouldStop: boolean = false;
  private provider = new Provider({ sequencer: { network: 'goerli-alpha-2' } });

  constructor(indexerId: string, url: string) {
    this.indexerId = indexerId;
    this.client = new NodeClient(url, credentials.createSsl());
  }

  async getActiveDripTransits() {

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

  async run(drip_transit: { pool: string, dtaddress: string }) {
    this.shouldStop = false;
    //@ts-ignore
    const last_activedrip = await ActiveDrip.findOne({ driptransit_address: drip_transit.dtaddress }, {}, { sort: { 'date': -1 } });
    var start_block = this.defaultblock;
    if (last_activedrip) {
      start_block = parseInt(last_activedrip.block);
    }
    console.log("test", start_block)
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

  async handleData(message: proto.StreamMessagesResponse__Output, drip_transit: { pool: string, dtaddress: string }) {
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

  async handleBlock(block: Block, drip_transit: { pool: string, dtaddress: string }) {
    if ((Date.now() - block.timestamp.getTime()) / 1000 <= 500) {
      //@ts-ignore
      await ActiveDrip.findOneAndUpdate(
        {
          drip_address: "last_block_index",
          driptransit_address: drip_transit.dtaddress
        },
        {
          drip_address: "last_block_index",
          driptransit_address: drip_transit.dtaddress,
          block: block.blockNumber,
          date: block.timestamp,
          updated: block.timestamp,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      this.shouldStop = true;
      return;
    }
    else {
      for (let receipt of block.transactionReceipts) {
        await this.handleTransaction(block, receipt, drip_transit);
      }
    }
  }

  async handleTransaction(
    block: Block,
    receipt: TransactionReceipt,
    drip_transit: { pool: string, dtaddress: string }
  ) {
    for (let event of receipt.events) {
      let t_address: string;
      let drip_adr = drip_transit.dtaddress;
      if (hexToBuffer(drip_adr, 32).equals(event.fromAddress)) {
        t_address = drip_transit.dtaddress;
        if (hexToBuffer(hash.getSelectorFromName("OpenDrip"), 32).equals(event.keys[0])) {
          console.log("OpenDrip");
          let owner: string = bufferToHex(Buffer.from(event.data[0])).toLowerCase();
          let drip_address: string = bufferToHex(Buffer.from(event.data[1])).toLowerCase();
          let borrowed_amount: any = uint256FromBytes(
            Buffer.from(event.data[2]),
            Buffer.from(event.data[3])
          );
          //console.log("owner", owner);
          console.log("drip_address", drip_address);
          //console.log("borrowed_amount", borrowed_amount);

          //@ts-ignore
          await ActiveDrip.findOneAndUpdate(
            {
              drip_address: drip_address,
              driptransit_address: drip_adr
            },
            {
              drip_address: drip_address,
              driptransit_address: drip_adr,
              block: block.blockNumber,
              date: block.timestamp,
              updated: block.timestamp,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        }
        else if (hexToBuffer(hash.getSelectorFromName("CloseDrip"), 32).equals(event.keys[0])) {
          console.log("CloseDrip");
          let caller: string = bufferToHex(Buffer.from(event.data[0])).toLowerCase();
          let to: string = bufferToHex(Buffer.from(event.data[1])).toLowerCase();
          console.log("caller", caller);
          //console.log("to", to);

          //@ts-ignore
          await ActiveDrip.findOneAndUpdate(
            {
              drip_address: caller,
              driptransit_address: drip_adr
            },
            {
              drip_address: caller,
              driptransit_address: drip_adr,
              block: block.blockNumber,
              active: false,
              updated: block.timestamp,
            },
            { upsert: true, setDefaultsOnInsert: true }
          )
        }
      }
    }
  }
}