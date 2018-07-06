# Wirelessbro eBay API

## Reason

- The original code has ebay api coupled into the code, which makes it hard to do unit test.
- Make it a seperate package also help us to reuse it.
- Decouple the code will help `ebay.js` looks more clear.

## Class

### 1. Ebay

A singleton in the application. It takes `appId`, `devId` and `certId` secret to construct. Provide the following functions:

#### [x] `GetOAuthToken`: For OAuth

#### [x] `GetRefreshToken`: For OAuth renew

#### [x] `GetSessionId`: For Auth'nAuth

### 2. EbayClient

It is like eBay seller. It takes `token` to construct. There are two authentication methods provided by
eBay, i.e `OAuth` and `Auth'nAuth` which you have to specify when you create it.

#### [x] `GetOrders`: For getting ebay order

#### [x] `GetSellerList`: For getting ebay seller products

#### [x] `GetUser`: Get account when create ebay user

#### [x] `CompleleSale`: Update tracking number

#### [ ] `ReviseItem`: Get the inventory of items

### 3. ParsedFixedPriceItemNotification

Parse info from the recieved ebay notification

General flow of calling eBay API:

1.  Build XML request by API name and authentication type. `xml-builder`
2.  Send the request to ebay endpoint.
3.  Parse the response into json. `xpath` is a good way

## Test

Use mocha as the unit test.