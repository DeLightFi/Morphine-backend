import * as Express from 'express';
import ErrorHandler from "../models/ErrorHandler";
import Pool from "../schema/pool.model";

class PoolController {
  defaultMethod() {
    throw new ErrorHandler(501, 'Not implemented method');
  }

  public async get_pool(req: Express.Request, res: Express.Response) {
    const { address } = req.params;
    //@ts-ignore
    const data = await Pool.find({ pool: address})
    res.json({data: data})
  }
}

export = new PoolController();