const moment = require("moment");
const o2x = require("./object-to-xml");
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
  "SetNotificationPreferences",
  "AddFixedPriceItem",
  "GetUserPreferences",
  "GetMyeBaySelling",
  "SetUserPreferences",
  "ReviseInventoryStatus",
  "ReviseFixedPriceItem",
  "UploadSiteHostedPictures",
  "VerifyAddFixedPriceItem",
  "GetItem",
  "ReviseFixedPriceItem",
  "AddMemberMessageRTQ",
  "GetNotificationsUsage",
  "GetMultipleItems"
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
  constructor({ token, authType, expire, env, appConfig }, loggerCallback) {
    if (!token) {
      throws.NoAuthTokenError();
    }
    this.loggerCallback = loggerCallback;
    this.config = {
      token,
      authType,
      expire,
      env,
      appConfig
    };
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
    return {
      RequesterCredentials: {
        eBayAuthToken: this.config.token
      }
    };
  }

  request(actionName, options, pagination, parseOptions, extraHeaders = {}) {
    const { page, pageNumberInjector } = pagination || {};

    if (this.isExpire) {
      throws.ExpiredTokenError(this.config.expire);
    }
    if (this.config.authType === "AUTHNAUTH" && actionName != "GetMultipleItems") {
      options = _.merge(options, this.credentials);
    }

    if (page) {
      if (pageNumberInjector) {
        options = pageNumberInjector(options, page);
      } else {
        options = _.merge(options, {
          Pagination: {
            PageNumber: page
          }
        });
      }
    }
    let xml;
    try {
      xml = buildXML(actionName, options);
    } catch (error) {
      throws.InvalidOptionsError(options);
    }
    let requestConfig
    if (actionName == "GetMultipleItems") {
      requestConfig = {
        method: "post",
        url: "http://open.api.ebay.com/shopping",
        headers: {
          "Content-Type": "application/xml",
          "X-EBAY-API-CALL-NAME": "GetMultipleItems",
          "X-EBAY-API-APP-ID": "Wireless-wireless-PRD-0134e8f72-ec8d371f",
          "X-EBAY-API-SITE-ID": "0",
          "X-EBAY-API-VERSION": "1089",
          "X-EBAY-API-REQUEST-ENCODING": "xml"
        },
        data: xml
      };
    } else {
      const headers = {
        "X-EBAY-API-CALL-NAME": `${actionName}`,
        ...this.headers,
        ...extraHeaders
      };
      requestConfig = {
        method: "post",
        url: this.url,
        headers,
        data: xml
      };
    }
    return axios(requestConfig)
      .then(response => {
        return response.data
      })
      .then(resXml => {
        this.loggerCallback && this.loggerCallback(xml, resXml);
        return toJson(resXml, parseOptions);
      })
      .then(JSON.parse)
      .then(json => {
        return Object.values(json)[0];
      })
      .then(jsonResponse => {
        if (jsonResponse.Ack === "Failure") {
          throws.RequestEbayError(jsonResponse);
        }
        return jsonResponse;
      });
  }

  static mergeResults(pagedResults) {
    return pagedResults.reduce((totalResult, current) => {
      return _.mergeWith(totalResult, current, (obj, src) => {
        if (_.isArray(obj)) {
          return obj.concat(src);
        }
      });
    }, {});
  }

  run(actionName, options, parseOptions, extraHeaders) {
    return this.request(
      actionName,
      options,
      null,
      parseOptions,
      extraHeaders
    ).then(result => {
      const pageNumberParser =
        EbayClient.pageNumberParsers[actionName] ||
        (result => ({
          pageNumber: parseFloat(result.PageNumber || 0),
          totalPage: parseFloat(
            _.get(result, "PaginationResult.TotalNumberOfPages", 0)
          )
        }));

      const { pageNumber, totalPage } = pageNumberParser(result);

      if (pageNumber >= totalPage) {
        return result;
      } else {
        return Promise.mapSeries(_.range(2, totalPage + 1), pn => {
          return this.request(
            actionName,
            options,
            {
              page: pn,
              pageNumberInjector: EbayClient.pageNumberInjectors[actionName]
            },
            parseOptions
          );
        })
          .then(pages => {
            return EbayClient.mergeResults([...pages, result]);
          })
          .then(result => {
            delete result[Object.keys(result)[0]].PageNumber;
            return result;
          });
      }
    });
  }

  runEachPage(actionName, callback, options, parseOptions, extraHeaders) {
    return this.request(
      actionName,
      options,
      null,
      parseOptions,
      extraHeaders
    ).then(result => {
      const pageNumberParser =
        EbayClient.pageNumberParsers[actionName] ||
        (result => ({
          pageNumber: parseFloat(result.PageNumber || 0),
          totalPage: parseFloat(
            _.get(result, "PaginationResult.TotalNumberOfPages", 0)
          )
        }));

      const { pageNumber, totalPage } = pageNumberParser(result);

      if (pageNumber >= totalPage) {
        return callback(result);
      } else {
        return callback(result).then(() =>
          Promise.each(_.chunk(_.range(2, totalPage + 1), 2), pns => {
            return Promise.map(pns, pn => {
              return this.request(
                actionName,
                options,
                {
                  page: pn,
                  pageNumberInjector: EbayClient.pageNumberInjectors[actionName]
                },
                parseOptions
              ).then(result => callback(result));
            });
          })
        );
      }
    });
  }

  get isExpire() {
    return moment(this.config.expire) <= moment.now();
  }
}

verbs.forEach(verb => {
  const action = verb.slice(0, 1).toLowerCase() + verb.slice(1);

  // each run
  EbayClient.prototype[`${action}Each`] = function(
    options = {},
    callback,
    parseOptions = {},
    extraHeaders
  ) {
    return new Promise((resolve, reject) => {
      if (typeof options !== "object") {
        throws.InvalidOptionsError(options);
      }
      options = _.merge(
        (EbayClient.defaults[`get${verb}Options`] ||
          EbayClient.defaults["defaultOptions"])(),
        options
      );
      parseOptions = _.merge(
        EbayClient.defaultParseOptions[`${verb}`],
        parseOptions
      );
      resolve({
        options,
        parseOptions
      });
    }).then(({ options, parseOptions }) =>
      this.runEachPage(verb, callback, options, parseOptions, extraHeaders)
    );
  };
  // merged run
  EbayClient.prototype[action] = function(
    options = {},
    parseOptions = {},
    extraHeaders
  ) {
    return new Promise((resolve, reject) => {
      if (typeof options !== "object") {
        throws.InvalidOptionsError(options);
      }
      options = _.merge(
        (EbayClient.defaults[`get${verb}Options`] ||
          EbayClient.defaults["defaultOptions"])(),
        options
      );
      parseOptions = _.merge(
        EbayClient.defaultParseOptions[`${verb}`],
        parseOptions
      );
      resolve({
        options,
        parseOptions
      });
    }).then(({ options, parseOptions }) =>
      this.run(verb, options, parseOptions, extraHeaders)
    );
  };
});

EbayClient.pageNumberParsers = {
  GetMyeBaySelling: result => {
    let totalPage = parseFloat(result.PageNumber);
    if (_.isNaN(totalPage)) {
      totalPage = parseFloat(
        _.get(result, "ActiveList.PaginationResult.TotalNumberOfPages")
      );
    }
    totalPage = _.isNaN(totalPage) ? 0 : totalPage;

    return {
      pageNumber: _.get(result, "ActiveList.PaginationResult.PageNumber") || 1,
      totalPage
    };
  }
};

EbayClient.pageNumberInjectors = {
  GetMyeBaySelling: (options, page) => {
    if (options.ActiveList) {
      options = _.merge(options, {
        ActiveList: {
          Pagination: {
            PageNumber: page
          }
        }
      });
    } else {
      options = _.merge(options, {
        Pagination: {
          PageNumber: page
        }
      });
    }

    return options;
  }
};

EbayClient.defaultParseOptions = {
  GetSellerList: {
    arrayNotation: [
      "Item",
      "Variation",
      "NameValueList",
      "Value",
      "PictureDetails"
    ]
  },
  GetMyeBaySelling: {
    arrayNotation: ["Item", "Variation", "NameValueList", "Value"]
  },
  GetItem: {
    arrayNotation: ["Variation", "NameValueList", "Value"]
  },
  GetOrders: {
    arrayNotation: [
      "Transaction",
      "Value",
      "PictureDetails",
      "Order",
      "NameValueList"
    ]
  },
  GetMultipleItems: {
    arrayNotation: [
      "Item",
      "Variation",
      "NameValueList"
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
    Pagination: {
      EntriesPerPage: 100,
      PageNumber: 1
    },
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
    Pagination: {
      EntriesPerPage: 100,
      PageNumber: 1
    }
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
      PayloadVersion: 1061
    },
    Version: 1061,
    WarningLevel: "High"
  }),
  getAddFixedPriceItemOptions: () => ({
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getGetUserPreferencesOptions: () => ({
    ShowSellerPaymentPreferences: true,
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getGetMyeBaySellingOptions: () => ({
    SellingSummary: {
      Include: true
    },
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getSetUserPreferencesOptions: () => ({
    OutOfStockControlPreference: true,
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getReviseInventoryStatusOptions: () => ({
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getReviseFixedPriceItemOptions: () => ({
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getUploadSiteHostedPicturesOptions: () => ({
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getVerifyAddFixedPriceItemOptions: () => ({
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  }),
  getGetItemOptions: () => ({
    ErrorLanguage: "en_US",
    WarningLevel: "High",
    DetailLevel: "ItemReturnDescription"
  }),
  getGetMultipleItemsOptions: () => ({
    IncludeSelector: "Variations, Details"
  }),
  defaultOptions: () => ({
    ErrorLanguage: "en_US",
    WarningLevel: "High"
  })
};
module.exports = EbayClient;
