import {
  credentials,
  NodeClient,
  proto,
  hexToBuffer,
  bufferToHex,
} from "@apibara/protocol";
import { Block, TransactionReceipt } from "@apibara/starknet";
import BN from "bn.js";
import Pool from "../schema/pool.model";
import { hash } from "starknet";
import { PoolMapping } from "./mapping";

export class PoolJob {
  private readonly client: NodeClient;
  private readonly indexerId: string;
  private shouldStop: boolean = false;

  constructor(indexerId: string, url: string) {
    this.indexerId = indexerId;
    this.client = new NodeClient(url, credentials.createSsl());
  }

  async run() {
    //@ts-ignore
    const current_block = parseInt((await Pool.findOne({}, {}, { sort: { 'date' : -1 } })).block);
    const messages = this.client.streamMessages(
      { 
        startingSequence: current_block
      }
    );

    return new Promise((resolve, reject) => {
      messages.on('data', (message) => {
        this.handleData(message);
        if (this.shouldStop){
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
      if((Date.now() - block.timestamp.getTime())/1000 <= 150){
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
    let i : number = 0;
    for (let event of receipt.events) {
      let t_address : string;
      let t_key : string;
      for(let mapping_address of PoolMapping.address){
        if(hexToBuffer(mapping_address, 32).equals(event.fromAddress)){
          t_address = mapping_address
          continue;
        }
      }
      if (!t_address) {
        i+=1;
        continue;
      }

      for(let mapping_key of PoolMapping.key){
        if(hexToBuffer(hash.getSelectorFromName(mapping_key), 32).equals(event.keys[0])){
          t_key = mapping_key
          continue;
        }
      }
      if (!t_key) {
        i+=1;
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
      await Pool.findOneAndUpdate(
        {
          event_id: `${bufferToHex(Buffer.from(receipt.transactionHash))}_${i}`
        },
        {
          event_id: `${bufferToHex(Buffer.from(receipt.transactionHash))}_${i}`,
          block: block.blockNumber,
          pool: t_address,
          event_name: t_key,
          from: from_,
          to: to,
          amount: amount,
          shares: shares,
          date: block.timestamp
        },
        {upsert: true, new: true, setDefaultsOnInsert: true}
      )

      i+=1;
    }
  }
}

function uint256FromBytes(low: Buffer, high: Buffer): BN {
  const lowB = new BN(low);
  const highB = new BN(high);
  return highB.shln(128).add(lowB);
}
