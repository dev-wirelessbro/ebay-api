const moment = require("moment");
const o2x = require("object-to-xml");
const _ = require("lodash");
const axios = require("axios");
const toJson = require("xml2json").toJson;
const Promise = require("bluebird");

const throws = require("./Error").throws;

const HEADING = '?xml version="1.0" encoding="utf-8"?';
const XMLNS = "urn:ebay:apis:eBLBaseComponents";

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
  constructor({ email, userId, token, authType, expire, env, appConfig }) {
    if (!token) {
      throws.NoAuthTokenError();
    }
    this.config = { email, userId, token, authType, expire, env, appConfig };
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

  get credentials() {
    return { RequesterCredentials: { eBayAuthToken: this.config.token } };
  }

  request(actionName, options, page) {
    if (this.authType === "AUTHNAUTH") {
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
      "X-EBAY-API-CALL-NAME": "GetSellerListRequest",
      ...this.headers
    };
    const requestConfig = { method: "post", url: this.url, headers, data: xml };
    return axios(requestConfig)
      .then(response => response.data)
      .then(toJson)
      .then(JSON.parse);
  }

  run(actionName, options) {
    return this.request(actionName, options).then(result => {
      const totalPage = parseFloat(
        _.get(
          Object.values(result)[0],
          "PaginationResult.TotalNumberOfPages",
          0
        )
      );
      const pageNumber = parseFloat(
        _.get(Object.values(result)[0], "PageNumber", 0)
      );
      if (pageNumber === totalPage) {
        return result;
      } else {
        return Promise.mapSeries(_.range(2, totalPage + 1), pn => {
          return this.request(actionName, options, pn);
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
    });
  }

  getSellerList(options = {}) {
    if (typeof options !== "object") {
      throws.InvalidOptionsError(options);
    }
    options = _.merge(EbayClient.defaults.getGetSellerListOptions(), options);
    return this.run("GetSellerList", options);
  }

  getOrders(options = {}) {
    if (typeof options !== "object") {
      throws.InvalidOptionsError(options);
    }
    options = _.merge(EbayClient.defaults.getGetOrdersOptions(), options);
    return this.run("GetOrders", options);
  }

  getUser(options = {}) {
    if (typeof options !== "object") {
      throws.InvalidOptionsError(options);
    }

    options = _.merge(EbayClient.defaults.getUserOptions, options);

    return this.run("GetUser", options);
  }

  completeSale(options = {}) {
    if (typeof options !== "object") {
      throws.InvalidOptionsError(options);
    }

    options = _.merge(EbayClient.defaults.completeSaleOptions, options);

    return this.run("CompleteSale", options);
  }

  get isExpire() {
    return moment(this.config.expire) <= moment.now();
  }
}

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
  getUserOptions: {
    DetailLevel: "ReturnAll"
  },
  completeSaleOptions: {
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }
};
module.exports = EbayClient;
