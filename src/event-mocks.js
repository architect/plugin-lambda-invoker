let { randomUUID } = require('crypto')

// Sit back and enjoy AWS's hilarious mix of Pascal-case, camel-case, and lowcase, sometimes even within the same event sources
module.exports = {
  customLambdas,
  events,
  queues,
  scheduled,
  tablesStreams,
}

function customLambdas (payload) {
  return payload || {}
}

function events (payload) {
  let Message = JSON.stringify(payload)
  return { Records: [ { Sns: { Message } } ] } // this is fine
}

function queues (payload) {
  let body = JSON.stringify(payload)
  return { Records: [ { body } ] } // also fine
}

function scheduled () {
  return {
    version: 0,
    id: randomUUID(),
    'detail-type': 'Scheduled Event',
    source: 'aws.events',
    account: 123456789012,
    time: new Date().toISOString(),
    region: 'Sandbox',
    resources: [
      'arn:architect-sandbox',
    ],
    detail: {},
  }
}

function tablesStreams (eventName, dynamoData) {
  return {
    Records: [
      {
        eventID: randomUUID().replace(/-/g, '').substr(0, 32),
        eventName,
        eventVersion: '1.1',
        eventSource: 'aws:dynamodb',
        awsRegion: 'Sandbox',
        dynamodb: {
          ApproximateCreationDateTime: new Date() / 1000,
          Keys: dynamoData?.Keys ?? { NOT_MOCKED: true },
          NewImage: dynamoData?.NewImage ?? { NOT_MOCKED: true },
          SequenceNumber: 0,
          SizeBytes: 0,
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        eventSourceARN: 'arn:architect-sandbox',
      },
    ],
  }
}
