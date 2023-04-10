import * as dotenv from 'dotenv';
import api from "api";
dotenv.config();

const configs: any = {
    EXTERNAL_API: process.env.EXTERNAL_API,
    EXTERNAL_API_TOKEN: process.env.EXTERNAL_API_TOKEN,
    CLIENT_ASSERTION_TYPE: process.env.UE_CLIENT_ASSERTION_TYPE,
    CLIENT_SECRET: process.env.UE_CLIENT_SECRET,
    CLIENT_ID: process.env.UE_CLIENT_ID,
    ACCESS_PUBLIC_KEY: process.env.UE_ACCESS_PUBLIC_KEY,
    ACCESS_SEED: process.env.UE_ACCESS_SEED,
    AUTHGROUP: process.env.UE_AUTHGROUP,
    SUBJECT: process.env.UE_SUBJECT,
    STREAM: process.env.UE_STREAM,
    CONSUMER: process.env.UE_CONSUMER,
    INBOX: process.env.UE_INBOX,
    SERVER: process.env.UE_SERVER,
    UEAUTH: process.env.UE_AUTH,
    UESTREAMS: process.env.UE_STREAMS,
    UE_STREAMS_EVENT_LABEL: process.env.UE_STREAMS_EVENT_LABEL,
    AUTHSDK: process.env.AUTHSDK,
    STREAMSDK: process.env.STREAMSDK
}

export default configs;