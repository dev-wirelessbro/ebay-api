const parseString = require("xml2js").parseString;
const Promise = require("bluebird");

function parseXML(data) {
  return new Promise((resolve, reject) => {
    parseString(data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function checkSuccessStatus(jsonData) {
  return Object.values(jsonData)[0].Ack[0] === "Success";
}

module.exports = {
  parseXML,
  checkSuccessStatus
};
