const moment = require("moment");
const o2x = require("object-to-xml");
const _ = require("lodash");
const axios = require("axios");

const throws = require("./Error").throws;

const HEADING = 'xml version="1.0" encoding="utf-8"?';
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

  request(actionName, options) {
    if (this.authType === "AUTHNAUTH") {
      options = _.merge(options, this.credentials);
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

    const requestConfig = {
      method: "post",
      url: this.url,
      headers,
      data: xml
    };

    return axios(requestConfig);
  }

  getSellerList(options = {}) {
    if (typeof options !== Object) {
      throws.InvalidOptionsError(options);
    }
    options = _.merge(EbayClient.defaults.getSellerListOptions, options);
    return this.request("GetSellerList", options);
  }

  get isExpire() {
    return moment(this.config.expire) <= moment.now();
  }
}

EbayClient.defaults = {
  getSellerListOptions: {
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
  }
};

module.exports = EbayClient;
