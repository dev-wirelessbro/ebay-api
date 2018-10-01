const xml2js = require("xml2js");
const xpath = require("xml2js-xpath");
const _ = require("lodash");

const paths = {
  UserId: "//RecipientUserID",
  UserEmail: "//Seller/Email",
  TotalPrice: "//AmountPaid",
  SalesTax: "//SalesTaxAmount",
  TransactionPrice: "//TransactionPrice",
  RecordNumber: "//SellingManagerSalesRecordNumber",
  Status: "//Ack",
  Type: "//NotificationEventName",
  OrderId: "//OrderID",
  BuyerId: "//Buyer/UserID",
  BuyerEmail: "//Buyer/Email",
  OrderCreatedTime: "//CreatedDate",
  OrderStatus: "//OrderStatus",
  OrderCancelStatus: "//CancelStatus",
  ShippingMethod: "//ShippingService",
  ShippingCost: "//ShippingServiceCost",
  EstimatedDeliveryTime: "//EstimatedDeliveryTimeMax",
  SignatureRaw: "//ebl:NotificationSignature",
  Timestamp: "//Timestamp",
  EventName: "//NotificationEventName",
  FinalValueFee: "//FinalValueFee"
};

class ParsedFixedPriceItemNotification {
  constructor(parsedXML) {
    this._parsed = parsedXML;
  }

  parse(path) {
    return xpath.evalFirst(this._parsed, path);
  }

  static fromXML(xml) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xml, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    }).then(parsedXML => new ParsedFixedPriceItemNotification(parsedXML));
  }
}

Object.keys(paths).forEach(fieldName => {
  ParsedFixedPriceItemNotification.prototype[`parse${fieldName}`] = function() {
    return this.parse(paths[fieldName]);
  };
});

ParsedFixedPriceItemNotification.prototype.parseShippingAddress = function() {
  const addressPaths = {
    name: "//ShippingAddress/Name",
    city: "//ShippingAddress/CityName",
    state: "//ShippingAddress/StateOrProvince",
    country: "//ShippingAddress/Country",
    phone: "//ShippingAddress/Phone",
    zip: "//ShippingAddress/PostalCode",
    line1: "//ShippingAddress/Street1",
    line2: "//ShippingAddress/Street2"
  };

  return _.mapValues(addressPaths, path => this.parse(path));
};

ParsedFixedPriceItemNotification.prototype.parseItem = function() {
  const itemPaths = {
    orderlineitem_id: "//OrderLineItemID",
    buyer: paths.BuyerId,
    qty: "//QuantityPurchased",
    price: paths.TransactionPrice,
    estimate_delivery: "//EstimatedDeliveryTimeMax",
    itemId: "//Item/ItemID"
  };

  return {
    ..._.mapValues(itemPaths, path => this.parse(path)),
    variation: xpath.find(this._parsed, "//NameValueList")  
  }
};

ParsedFixedPriceItemNotification.prototype.parseSignature = function() {
  const signatureRaw = this.parseSignatureRaw();

  return signatureRaw._;
};

module.exports = ParsedFixedPriceItemNotification;
