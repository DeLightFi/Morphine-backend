import {
  credentials,
  NodeClient,
  proto,
  hexToBuffer,
  bufferToHex,
} from "@apibara/protocol";
import { Block, TransactionReceipt } from "@apibara/starknet";
import * as fs from "fs";
import BN from "bn.js";
import PoolEvent from "../schema/poolevent.model";
import PoolValue from "../schema/poolvalue.model";
import { hash, Provider, Contract, json } from "starknet";
import { PoolMapping } from "./mapping";


function uint256FromBytes(low: Buffer, high: Buffer): BN {
  const lowB = new BN(low);
  const highB = new BN(high);
  return highB.shln(128).add(lowB);
}


// Use apibara to fetch blockchain events, then decode if these 
// events are pool events, and if there are in the mapping
export class PoolEventsFetcher {
  private readonly client: NodeClient;
  private readonly indexerId: string;
  private defaultblock: number = 36875;
  private shouldStop: boolean = false;

  constructor(indexerId: string, url: string) {
    this.indexerId = indexerId;
    this.client = new NodeClient(url, credentials.createSsl());
  }

  async run() {
    //@ts-ignore
    const last_poolevent = await PoolEvent.findOne({}, {}, { sort: { 'date': -1 } });
    var start_block = this.defaultblock;
    if (last_poolevent) {
      start_block = parseInt(last_poolevent.block);
    }

    const messages = this.client.streamMessages(
      {
        startingSequence: start_block
      }
    );

    return new Promise((resolve, reject) => {
      messages.on('data', (message) => {
        this.handleData(message);
        if (this.shouldStop) {
          resolve(undefined);
        }
      })
      messages.on('error', reject)
      messages.on('end', resolve)
    })
  }

  async handleData(message: proto.StreamMessagesResponse__Output) {
    if (message.data) {
      if (!message.data.data.value) {
        throw new Error("received invalid data");
      }
      const block = Block.decode(message.data.data.value);
      await this.handleBlock(block);
    } else if (message.invalidate) {
      console.log(message.invalidate);
    }
  }

  async handleBlock(block: Block) {
    for (let receipt of block.transactionReceipts) {
      if ((Date.now() - block.timestamp.getTime()) / 1000 <= 150) {
        this.shouldStop = true;
        return;
      }
      await this.handleTransaction(block, receipt);
    }
  }

  async handleTransaction(
    block: Block,
    receipt: TransactionReceipt
  ) {
    let i: number = 0;
    for (let event of receipt.events) {
      let t_address: string;
      let t_key: string;
      for (let mapping_address of PoolMapping.address) {
        if (hexToBuffer(mapping_address, 32).equals(event.fromAddress)) {
          t_address = mapping_address
          continue;
        }
      }
      if (!t_address) {
        i += 1;
        continue;
      }

      for (let mapping_key of PoolMapping.key) {
        if (hexToBuffer(hash.getSelectorFromName(mapping_key), 32).equals(event.keys[0])) {
          t_key = mapping_key
          continue;
        }
      }
      if (!t_key) {
        i += 1;
        continue;
      }

      const from_ = bufferToHex(Buffer.from(event.data[0]))
      const to = bufferToHex(Buffer.from(event.data[1]))
      const amount = uint256FromBytes(
        Buffer.from(event.data[2]),
        Buffer.from(event.data[3])
      );
      const shares = uint256FromBytes(
        Buffer.from(event.data[4]),
        Buffer.from(event.data[5])
      );

      //@ts-ignore
      await PoolEvent.findOneAndUpdate(
        {
          event_id: `${bufferToHex(Buffer.from(receipt.transactionHash))}_${i}`
        },
        {
          event_id: `${bufferToHex(Buffer.from(receipt.transactionHash))}_${i}`,
          block: block.blockNumber,
          pool_address: t_address,
          event_name: t_key,
          from: from_,
          to: to,
          amount: amount,
          shares: shares,
          date: block.timestamp
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )

      i += 1;
    }
  }
}


// borrowrate / supplyrate / totalassets /  totalborrows --> hourly
export class PoolValuesFetcher {
  // init
  private provider = new Provider({ sequencer: { network: 'goerli-alpha-2' } });
  private compiledABI = json.parse(fs.readFileSync(require.resolve("./abi/pool.json")).toString("ascii"));

  async CallContract(pooladdress: string) {
    const poolContract = new Contract(this.compiledABI.abi, pooladdress, this.provider);

    const borrowrate = await poolContract.call("borrowRate");
    const totalsupply = await poolContract.call("totalSupply");
    const totalassets = await poolContract.call("totalAssets");
    const totalborrowed = await poolContract.call("totalBorrowed");

    //@ts-ignore
    const newpoolvalue = new PoolValue(
      {
        pool_address: pooladdress,
        borrowrate: uint256FromBytes(borrowrate[0].low, borrowrate[0].high).toString(),
        totalsupply: uint256FromBytes(totalsupply[0].low, totalsupply[0].high).toString(),
        totalassets: uint256FromBytes(totalassets[0].low, totalassets[0].high).toString(),
        totalborrowed: uint256FromBytes(totalborrowed[0].low, totalborrowed[0].high).toString(),
        date: Date.now()
      }
    )
    await newpoolvalue.save()
  }

  async PoolIterations() {
    for (let pool_address of PoolMapping.address) {
      await this.CallContract(pool_address);
    }
  }
}
