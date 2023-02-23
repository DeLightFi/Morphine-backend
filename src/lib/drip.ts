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
import DripValue from "../schema/dripvalue.model";
import { hash, Provider, Contract } from "starknet";
import dataprovider_abi from "./abi/dataprovider.json"
import { DataProviderMapping, RegistryMapping } from "./mapping";

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

  constructor(indexerId: string, url: string) {
    this.indexerId = indexerId;
    this.client = new NodeClient(url, credentials.createSsl());
  }

  async run(drip_transit: { pool: string, dtaddress: string }) {
    //@ts-ignore
    const last_activedrip = await ActiveDrip.findOne({ pool_address: drip_transit.pool }, {}, { sort: { 'date': -1 } });
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
          owner_address: "last_block_index",
          pool_address: drip_transit.pool
        },
        {
          owner_address: "last_block_index",
          pool_address: drip_transit.pool,
          block: block.blockNumber,
          active: false,
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
          console.log("owner", owner);

          //@ts-ignore
          await ActiveDrip.findOneAndUpdate(
            {
              owner_address: owner,
              pool_address: drip_transit.pool
            },
            {
              owner_address: owner,
              pool_address: drip_transit.pool,
              block: block.blockNumber,
              date: block.timestamp,
              updated: block.timestamp,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        }
        else if (hexToBuffer(hash.getSelectorFromName("CloseDrip"), 32).equals(event.keys[0])) {
          console.log("CloseDrip");
          let to: string = bufferToHex(Buffer.from(event.data[1])).toLowerCase();
          console.log("to", to);

          //@ts-ignore
          await ActiveDrip.findOneAndUpdate(
            {
              owner_address: to,
              pool_address: drip_transit.pool
            },
            {
              drip_address: to,
              pool_address: drip_transit.pool,
              block: block.blockNumber,
              active: false,
              updated: block.timestamp,
            },
            { upsert: true, setDefaultsOnInsert: true }
          )

          //@ts-ignore
          await DripValue.deleteMany(
            {
              owner: to,
              pool: drip_transit.pool
            },
          )
        }
      }
    }
  }
}


export class DripValuesFetcher {
  // init
  private provider = new Provider({ sequencer: { network: 'goerli-alpha-2' } });

  async CallContract(activedrip: { owner: string, pool: string }) {
    const poolContract = new Contract(dataprovider_abi, DataProviderMapping.contract_address, this.provider);

    const info = await poolContract.getUserDripInfoFromPool(RegistryMapping.contract_address, activedrip.owner, activedrip.pool);

    //@ts-ignore
    const newdripvalue = new DripValue(
      {
        owner: activedrip.owner.toLowerCase(),
        pool: activedrip.pool.toLowerCase(),
        user_balance: uint256FromBytes(info.DripFullInfo.user_balance.low, info.DripFullInfo.user_balance.high).toString(),
        total_balance: uint256FromBytes(info.DripFullInfo.total_balance.low, info.DripFullInfo.total_balance.high).toString(),
        total_weighted_balance: uint256FromBytes(info.DripFullInfo.total_weighted_balance.low, info.DripFullInfo.total_weighted_balance.high).toString(),
        debt: uint256FromBytes(info.DripFullInfo.debt.low, info.DripFullInfo.debt.high).toString(),
        health_factor: uint256FromBytes(info.DripFullInfo.health_factor.low, info.DripFullInfo.health_factor.high).toString(),
        date: Date.now()
      }
    )
    await newdripvalue.save()
  }

  async DripIterations() {
    //@ts-ignore
    const activedrips = await ActiveDrip.find({ owner_address: { "$ne": "last_block_index" }, active: true })

    for (let activedrip of activedrips) {
      await this.CallContract({ owner: activedrip.owner_address, pool: activedrip.pool_address });
    }
  }
}