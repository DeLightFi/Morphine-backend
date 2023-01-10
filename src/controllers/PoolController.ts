import * as Express from 'express';
import ErrorHandler from "../models/ErrorHandler";
import { StreamClient, ChannelCredentials } from '@apibara/protocol'
import { Filter, FieldElement, v1alpha2 as starknet } from '@apibara/starknet'
import { hash } from 'starknet';
import { apibara } from '../lib/apibara';

class PoolController {
  defaultMethod() {
    throw new ErrorHandler(501, 'Not implemented method');
  }

  GetData = ((req: Express.Request, res: Express.Response) => {
    const results = apibara(BigInt(req.params.address));
    res.status(201).json({results: results})
  })
}

export = new PoolController();