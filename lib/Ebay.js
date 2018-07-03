const axios = require("axios");
const _ = require("lodash");
const { parseXML, checkSuccessStatus } = require("./utils");

class Ebay {
  constructor({ clientId, devId, certId, redirectURI, scope, authType, env }) {
    const config = {
      clientId,
      devId,
      certId,
      scope,
      authType,
      env,
      redirectURI,
      scope: Object.assign([], scope)
    };
    if (authType === "OAuth") {
      config.credential = Ebay.calCredential(clientId, certId);
    }

    if (!env) {
      throw new Error(`invalid env ${env}`);
    }

    if (env === "sandbox") {
      this.url = "https://api.sandbox.ebay.com/";
    } else if (env === "production") {
      this.url = "https://api.ebay.com/";
    }
    this.config = config;
  }

  getToken(grant_type, code) {
    const { credential } = this.config;

    const option = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: this.config.credential
      },
      data: {
        grant_type,
        [grant_type === "refresh_token" ? "refresh_token" : "code"]: code,
        redirect_uri: this.config.redirectURI
      },
      baseURL: this.url,
      url: "identity/v1/oauth2/token"
    };

    return axios(option).then(response => {
      const keys = [
        "access_token",
        "expires_in",
        "refresh_token",
        "refresh_token_expires_in",
        "token_type"
      ];
      return _.pick(response.data, keys);
    });
  }

  getOAuthToken(code) {
    return this.getToken("authorization_code", code);
  }

  getRefreshToken(code) {
    return this.getToken("refresh_token", code);
  }

  calleBayWithAuthNAuth(xml, funcName) {
    const config = {
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
        "X-EBAY-API-CALL-NAME": funcName,
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-APP-NAME": this.config.clientid,
        "X-EBAY-API-DEV-NAME": this.config.devId,
        "X-EBAY-API-CERT-NAME": this.config.certId
      }
    };
    const url = this.url + "ws/api.dll";

    return axios
      .post(url, xml, config)
      .then(response => {
        return parseXML(response.data);
      })
      .then(jsonData => {
        if (!checkSuccessStatus(jsonData)) {
          throw new Error(Object.values(jsonData)[0].Errors[0].LongMessage[0]);
        }

        return jsonData;
      });
  }

  static calCredential(clientId, certId) {
    return "Basic " + Buffer.from(`${clientId}:${certId}`).toString("base64");
  }

  getSessionId() {
    const headers = {
      "Content-Type": "text/xml",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1061",
      "X-EBAY-API-CALL-NAME": "FetchToken",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-APP-NAME": this.config.clientid,
      "X-EBAY-API-DEV-NAME": this.config.devId,
      "X-EBAY-API-CERT-NAME": this.config.certId
    };

    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <GetSessionIDRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <!-- Call-specific Input Fields -->
      <RuName>${this.config.redirectURI}</RuName>
      <!-- Standard Input Fields -->
      <ErrorLanguage>en_US</ErrorLanguage>
      <Version>1057</Version>
      <WarningLevel>High</WarningLevel>
    </GetSessionIDRequest>`;

    return this.calleBayWithAuthNAuth(xml, "GetSessionID").then(
      data => _.get(Object.values(data)[0], "SessionID")[0]
    );
  }
}

module.exports = Ebay;
