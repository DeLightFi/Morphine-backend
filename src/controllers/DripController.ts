import * as Express from 'express';
import ErrorHandler from "../models/ErrorHandler";
import ActiveDrip from "../schema/activedrip.model";
import DripValue from "../schema/dripvalue.model";


class DripController {
  defaultMethod() {
    throw new ErrorHandler(501, 'Not implemented method');
  }

  public async get_all_activedrip(req: Express.Request, res: Express.Response) {
    //@ts-ignore
    const data = await ActiveDrip.find({ owner_address: { "$ne": "last_block_index" }, active: true })
    res.json({ data: data })
  }

  public async get_all_dripvalues(req: Express.Request, res: Express.Response) {
    const { owner, pool } = req.params;
    //@ts-ignore
    const data = await DripValue.find({ owner: owner.toLowerCase(), pool: pool.toLowerCase() })
    res.json({ data: data })
  }
}

export = new DripController();