import * as Express from 'express';
import ErrorHandler from "../models/ErrorHandler";
import PoolEvent from "../schema/poolevent.model";

class PoolController {
  defaultMethod() {
    throw new ErrorHandler(501, 'Not implemented method');
  }

  public async get_pool(req: Express.Request, res: Express.Response) {
    const { address } = req.params;
    //@ts-ignore
    const data = await PoolEvent.find({ pool_address: address})
    res.json({data: data})
  }
}

export = new PoolController();