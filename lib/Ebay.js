const axios = require("axios");
const _ = require("lodash");

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

  getSessionId() {
      // TO-DO
  }
}

Ebay.calCredential = function(clientId, certId) {
  return "Basic " + Buffer.from(`${clientId}:${certId}`).toString("base64");
};

module.exports = Ebay;
