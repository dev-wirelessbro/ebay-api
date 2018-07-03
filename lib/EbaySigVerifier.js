"use strict";
const moment = require("moment");
const md5 = require("blueimp-md5");

module.exports = class EbaySigVerifier {
  constructor(appId, devId, authCert) {
    this._appId = appId;
    this._devId = devId;
    this._authCert = authCert;
  }

  // ref: https://developer.ebay.com/DevZone/guides/ebayfeatures/Notifications/Notifications.html
  calculateSig(timestamp) {
    const momentUTCTime = moment.utc(timestamp);
    const timeSig = momentUTCTime.format("YYYY-MM-DDTHH:mm:ss.SSS") + "Z";
    const sig = timeSig + this._devId + this._appId + this._authCert;
    return Buffer.from(md5(sig), "hex").toString("base64");
  }

  verify(timestamp, sig) {
    const notificationTime = moment.utc(timestamp);
    const timeDiff = moment.utc() - notificationTime;
    return (
      this.calculateSig(notificationTime) === sig &&
      timeDiff <= moment.duration(10, "minute") &&
      timeDiff >= 0
    );
  }
};
