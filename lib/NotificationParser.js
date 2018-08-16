const _ = require('lodash')
const toJson = require("xml2json").toJson;
const ParseFixedPriceItemNotification = require('./ParsedFixedPriceItemNotification')

class NotificationParser {
    static parseFixedPriceItemNotification(xml) {
        return ParseFixedPriceItemNotification.fromXML(xml)
    }
    static parseNotification(xml) {
        return _.values(_.get(JSON.parse(toJson(xml, {arrayNotation: ['Message']})), 'soapenv:Envelope.soapenv:Body'))[0]
    }
}

module.exports = NotificationParser