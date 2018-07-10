const moment = require("moment");
const o2x = require("object-to-xml");
const _ = require("lodash");
const axios = require("axios");
const toJson = require("xml2json").toJson;
const Promise = require("bluebird");

const throws = require("./Error").throws;

const HEADING = '?xml version="1.0" encoding="utf-8"?';
const XMLNS = "urn:ebay:apis:eBLBaseComponents";

const verbs = [
  "GetSellerList",
  "GetOrders",
  "GetUser",
  "CompleteSale",
  "SetNotificationPreferences"
];

const buildXML = (actionName, options = {}) => {
  return o2x({
    [HEADING]: null,
    [`${actionName}Request`]: {
      "@": {
        xmlns: XMLNS
      },
      "#": options
    }
  });
};

class EbayClient {
  constructor({ token, authType, expire, env, appConfig }) {
    if (!token) {
      throws.NoAuthTokenError();
    }
    this.config = { token, authType, expire, env, appConfig };
    if (env === "sandbox") {
      this.url = "https://api.sandbox.ebay.com/ws/api.dll";
    } else if (env === "production") {
      this.url = "https://api.ebay.com/ws/api.dll";
    } else {
      throws.NotSupportedEnvError(env);
    }

    if (authType === "AUTHNAUTH") {
      if (
        !appConfig ||
        !appConfig.clientId ||
        !appConfig.devId ||
        !appConfig.certId
      ) {
        throws.InvalidAuthNAuthConfigError();
      }
      this.headers = {
        "Content-Type": "text/xml",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-APP-NAME": appConfig.clientId,
        "X-EBAY-API-DEV-NAME": appConfig.devId,
        "X-EBAY-API-CERT-NAME": appConfig.certId
      };
    } else if (authType === "OAUTH") {
      this.headers = {
        "Content-Type": "text/xml",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-IAF-TOKEN": "Bearer " + token
      };
    } else {
      throws.NotSupportedAuthTypeError(authType);
    }
  }

  updateToken(token) {
    this.config.token = token;
    if (this.config.authType === "OAUTH") {
      this.headers = {
        ...this.headers,
        "X-EBAY-API-IAF-TOKEN": "Bearer " + token
      };
    }
  }

  get credentials() {
    return { RequesterCredentials: { eBayAuthToken: this.config.token } };
  }

  request(actionName, options, page, parseOptions) {
    if (this.isExpire) {
      throws.ExpiredTokenError(this.config.expire);
    }
    if (this.config.authType === "AUTHNAUTH") {
      options = _.merge(options, this.credentials);
    }

    if (page) {
      options = _.merge(options, { Pagination: { PageNumber: page } });
    }
    let xml;
    try {
      xml = buildXML(actionName, options);
    } catch (error) {
      throws.InvalidOptionsError(options);
    }
    const headers = {
      "X-EBAY-API-CALL-NAME": `${actionName}`,
      ...this.headers
    };
    const requestConfig = { method: "post", url: this.url, headers, data: xml };
    return axios(requestConfig)
      .then(response => response.data)
      .then(xml => toJson(xml, parseOptions))
      .then(JSON.parse)
      .then(json => {
        return Object.values(json)[0];
      })
      .then(jsonResponse => {
        if (jsonResponse.Ack != "Success") {
          throws.RequestEbayError(jsonResponse);
        }
        return jsonResponse;
      });
  }

  run(actionName, options, parseOptions) {
    return this.request(actionName, options, null, parseOptions).then(
      result => {
        const totalPage = parseFloat(
          _.get(result, "PaginationResult.TotalNumberOfPages", 0)
        );
        const pageNumber = parseFloat(result.PageNumber || 0);
        if (pageNumber === totalPage) {
          return result;
        } else {
          return Promise.mapSeries(_.range(2, totalPage + 1), pn => {
            return this.request(actionName, options, pn, parseOptions);
          })
            .then(pages => {
              return pages.reduce((totalResult, current) => {
                return _.mergeWith(totalResult, current, (obj, src) => {
                  if (_.isArray(obj)) {
                    return obj.concat(src);
                  }
                });
              }, result);
            })
            .then(result => {
              delete result[Object.keys(result)[0]].PageNumber;
              return result;
            });
        }
      }
    );
  }

  get isExpire() {
    return moment(this.config.expire) <= moment.now();
  }
}

verbs.forEach(verb => {
  const action = verb.slice(0, 1).toLowerCase() + verb.slice(1);
  EbayClient.prototype[action] = function(options = {}, parseOptions = {}) {
    return new Promise((resolve, reject) => {
      if (typeof options !== "object") {
        throws.InvalidOptionsError(options);
      }
      options = _.merge(EbayClient.defaults[`get${verb}Options`](), options);
      parseOptions = _.merge(
        EbayClient.defaultParseOptions[`${verb}`],
        parseOptions
      );
      resolve({ options, parseOptions });
    }).then(({ options, parseOptions }) =>
      this.run(verb, options, parseOptions)
    );
  };
});

EbayClient.defaultParseOptions = {
  GetSellerList: {
    arrayNotation: [
      "Item",
      "Variation",
      "NameValueList",
      "Value",
      "PictureDetails"
    ]
  }
};

EbayClient.defaults = {
  getGetSellerListOptions: () => ({
    StartTimeFrom: moment()
      .subtract(120, "days")
      .toISOString(),
    StartTimeTo: moment().toISOString(),
    IncludeWatchCount: true,
    Pagination: { EntriesPerPage: 100, PageNumber: 1 },
    WarningLevel: "High",
    ErrorLanguage: "en_US",
    DetailLevel: "ItemReturnDescription",
    IncludeVariations: true
  }),
  getGetOrdersOptions: () => ({
    CreateTimeFrom: moment()
      .subtract(120, "days")
      .toISOString(),
    CreateTimeTo: moment().toISOString(),
    WarningLevel: "High",
    OrderRole: "Seller",
    OrderStatus: "Completed",
    Pagination: { EntriesPerPage: 100, PageNumber: 1 }
  }),
  getGetUserOptions: () => ({
    DetailLevel: "ReturnAll"
  }),
  getCompleteSaleOptions: () => ({
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getSetNotificationPreferencesOptions: () => ({
    ApplicationDeliveryPreferences: {
      PayloadVersion: 1057
    },
    Version: 1061,
    WarningLevel: "High"
  })
};
module.exports = EbayClient;
