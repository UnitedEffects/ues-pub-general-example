# UE Streams Example: General API to Stream Publishing

To use this example you will need to [sign up for free with United Effects and register a platform for your Company](https://core.unitedeffects.com)

## Configure

This is a template/example you can use as a recipe to set up a service which periodically polls a given API and then sends that data to UE Streams.

To get started, proceed as follows:

* Create a subject in UE Streams that ends with a wildcard (e.g., 'example.>')
* Create a stream in UE Streams and associate that subject
* Request publish access to the stream and make note of the values provided
* Copy .env.update to .env
* Update the data in .env from your publish access values
* Define an event label and update .env UE_STREAMS_EVENT_LABEL (e.g., 'twitter-data', 'user-data', 'sales-transactions', etc.)
* Choose an API you wish to integrate to and enter both the API URI and an API KEY in the .env values for EXTERNAL_API and EXTERNAL_API_TOKEN
* Update the code in index.ts function callAPI to account for your specific API call and response

```
yarn && yarn dev
```
