/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



import * as schedule from "node-schedule";
import Test from "../schema/test.model";
class job {

  constructor() {

  }
  //Shop code refresh each 2 minutes, cf. cron guru
  public shopRefresh() {
    schedule.scheduleJob('*/2 * * * *', async function () {

      const code = Math.floor(1000 + Math.random() * 9000);
      const set = new Test({
        shopcode: code
      })
      await set.save();

    });
  }
}

export default new job();