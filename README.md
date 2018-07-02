# Wirelessbro eBay API

## Reason
- The original code has ebay api coupled into the code, which makes it hard to do unit test.
- Make it a seperate package also help us to reuse it.
- Decouple the code will help `ebay.js` looks more clear.

## Class
### 1. Ebay
A singleton in the application. It takes `appId`, `devId` and `certId` secret to construct. Provide the following functions:
#### `GetToken`: For OAuth
#### `GetRefreshToken`: For OAuth renew
#### `GetSessionId`: For Auth'nAuth
#### `RecieveNotification`: For parse eBay notification


### 2. EbayClient
It is like eBay seller. It takes `token` to construct. There are two authentication methods provided by
eBay, i.e `OAuth` and `Auth'nAuth` which you have to specify when you create it. 

General flow of calling eBay API:
1. Build XML request by API name and authentication type. `xml-builder`
2. Send the request to ebay endpoint.
3. Parse the response into json. `xpath` is a good way


## Test
Use mocha as the unit test. 