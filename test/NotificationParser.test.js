const assert = require("assert");
const NotificationParser = require('../lib/NotificationParser')
const _ = require('lodash')

const xmlSingle = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://
www.w3.org/2001/XMLSchema"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
 <soapenv:Header>
  <ebl:RequesterCredentials soapenv:mustUnderstand="0"
 xmlns:ns="urn:ebay:apis:eBLBaseComponents"
 xmlns:ebl="urn:ebay:apis:eBLBaseComponents">
   <ebl:NotificationSignature xmlns:ebl="urn:ebay:apis:eBLBaseComponents">ABC123==
 </ebl:NotificationSignature>
  </ebl:RequesterCredentials>
 </soapenv:Header>
 <soapenv:Body>
  <GetMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
   <Timestamp>2005-08-04T22:52:20.701Z</Timestamp>
   <Ack>Success</Ack>
   <CorrelationID>94654140</CorrelationID>
   <Version>423</Version>
   <Build>e423_core_API_1556612_R1</Build>
   <NotificationEventName>MyMessageseBayMessageHeader</NotificationEventName>
   <RecipientUserID>sampleuser</RecipientUserID>
   <Messages>
    <Message>
     <Sender>testuser</Sender>
     <RecipientUserID>sampleuser</RecipientUserID>
     <Subject>The request with originalMessageId</Subject>
     <MessageID>1989403</MessageID>
     <Flagged>false</Flagged>
     <Read>false</Read>
     <ReceiveDate>2005-08-04T22:52:08.000Z</ReceiveDate>
     <ExpirationDate>2005-10-03T22:52:08.000Z</ExpirationDate>
     <ResponseDetails>
      <ResponseEnabled>false</ResponseEnabled>
     </ResponseDetails>
     <Folder>
      <FolderID>0</FolderID>
     </Folder>
    </Message>
   </Messages>
  </GetMyMessagesResponse>
 </soapenv:Body>
</soapenv:Envelope>`

const xmlMultiple = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://
www.w3.org/2001/XMLSchema"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
 <soapenv:Header>
  <ebl:RequesterCredentials soapenv:mustUnderstand="0"
 xmlns:ns="urn:ebay:apis:eBLBaseComponents"
 xmlns:ebl="urn:ebay:apis:eBLBaseComponents">
   <ebl:NotificationSignature xmlns:ebl="urn:ebay:apis:eBLBaseComponents">ABC123==
 </ebl:NotificationSignature>
  </ebl:RequesterCredentials>
 </soapenv:Header>
 <soapenv:Body>
  <GetMyMessagesResponse xmlns="urn:ebay:apis:eBLBaseComponents">
   <Timestamp>2005-08-04T22:52:20.701Z</Timestamp>
   <Ack>Success</Ack>
   <CorrelationID>94654140</CorrelationID>
   <Version>423</Version>
   <Build>e423_core_API_1556612_R1</Build>
   <NotificationEventName>MyMessageseBayMessageHeader</NotificationEventName>
   <RecipientUserID>sampleuser</RecipientUserID>
   <Messages>
    <Message>
     <Sender>testuser</Sender>
     <RecipientUserID>sampleuser</RecipientUserID>
     <Subject>The request with originalMessageId</Subject>
     <MessageID>1989403</MessageID>
     <Flagged>false</Flagged>
     <Read>false</Read>
     <ReceiveDate>2005-08-04T22:52:08.000Z</ReceiveDate>
     <ExpirationDate>2005-10-03T22:52:08.000Z</ExpirationDate>
     <ResponseDetails>
      <ResponseEnabled>false</ResponseEnabled>
     </ResponseDetails>
     <Folder>
      <FolderID>0</FolderID>
     </Folder>
    </Message>
     <Message>
      <Sender>testuser</Sender>
      <RecipientUserID>sampleuser</RecipientUserID>
      <Subject>The request with originalMessageId</Subject>
      <MessageID>1989404</MessageID>
      <Flagged>false</Flagged>
      <Read>false</Read>
      <ReceiveDate>2005-08-05T22:52:08.000Z</ReceiveDate>
      <ExpirationDate>2005-10-05T22:52:08.000Z</ExpirationDate>
      <ResponseDetails>
       <ResponseEnabled>false</ResponseEnabled>
      </ResponseDetails>
      <Folder>
       <FolderID>0</FolderID>
      </Folder>
     </Message>
   </Messages>
  </GetMyMessagesResponse>
 </soapenv:Body>
</soapenv:Envelope>`


describe('should parse general xml notification into json', () => {
    it('parse MyMessages Notifications', async () => {
        const json = NotificationParser.parseNotification(xmlSingle)
        assert(json.Ack)
    })

    it('message should be an array', async () => {
        const json = NotificationParser.parseNotification(xmlSingle)
        assert(_.isArray(json.Messages.Message))
    })
})