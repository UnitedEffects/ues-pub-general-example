import { connect, StringCodec, credsAuthenticator } from 'nats';
import configs from "./config";
import axios from "axios";
import api from 'api';
import JWT from 'jsonwebtoken';
import {v4 as uuid} from 'uuid';

const authSdk = api(configs.AUTHSDK);
const streamSdk = api(configs.STREAMSDK);

const AUTH_AUDIENCE = `${configs.UEAUTH}/${configs.AUTHGROUP}/token`;
const STREAM_AUDIENCE = `${configs.UESTREAMS}/api/${configs.AUTHGROUP}`

async function getSecretJwt(minutes = 1) {
    // defaulting expiration to 1 minute
    const claims = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now()/1000 + (minutes*60)),
        iss: configs.CLIENT_ID,
        aud: AUTH_AUDIENCE,
        sub: configs.CLIENT_ID,
        jti: uuid()
    };
    // depending on the expiration you choose, you could cache this
    return JWT.sign(claims, configs.CLIENT_SECRET);
}

/**
 * The below function uses the SDK, but if you wish to make the request
 * directly you can. You'd make requests to the url https://auth.unitedeffects.com
 * See the API Reference in our docs under UE Auth, postGroupToken
 **/
async function requestToken() {
    // use the above function to get the token
    const secretJwt = await getSecretJwt();
    // the access scope is what allows the permissions to flow to the token
    const options = {
        grant_type: 'client_credentials',
        audience: STREAM_AUDIENCE,
        client_assertion: secretJwt,
        client_assertion_type: configs.CLIENT_ASSERTION_TYPE,
        scope: 'access'
    };
    const token = await authSdk.postGroupToken(options, {
        group: configs.AUTHGROUP
    }).catch((err: any) => {
        console.error('requestToken', configs.AUTHGROUP, err)
    });

    // you could cache this to reduce the number of UE Auth requests
    return token.data.access_token;
}

/**
 * The below function uses the SDK, but if you wish to make the request
 * directly you can. You'd make requests to the url https://stream.uecore.io
 * See the API Reference in our docs under UE Streams, getJwt
 **/
async function getStreamJwt() {
    const token = await requestToken();
    streamSdk.auth(token);
    const result = await streamSdk.getJwt({
        publicKey: configs.ACCESS_PUBLIC_KEY,
        coreClientId: configs.CLIENT_ID,
        expires: 3600 //value is in seconds. setting a 1 hour expiration. Max allowed is 7 days
    }, {
        group: configs.AUTHGROUP,
        cluster: 'shared',
        account: 'simple'
    }).catch((err: any) => console.error(err));

    // you should check to make sure everything worked as expected
    if(!result?.data?.data?.jwt) {
        throw new Error('Unable to get stream access jwt');
    }
    return result.data.data.jwt;
}

async function creds() {
    const jwt = await getStreamJwt();
    return `-----BEGIN NATS USER JWT-----
    ${jwt}
  ------END NATS USER JWT------

************************* IMPORTANT *************************
  NKEY Seed printed below can be used sign and prove identity.
  NKEYs are sensitive and should be treated as secrets.

  -----BEGIN USER NKEY SEED-----
    ${configs.ACCESS_SEED}
  ------END USER NKEY SEED------
`;
}

async function start() {
    let nc;
    try {
        const credentials = await creds();
        nc = await connect({
            name: 'demo-connection',
            servers: configs.SERVER,
            authenticator: credsAuthenticator(new TextEncoder().encode(credentials)),
            inboxPrefix: configs.INBOX,
            //debug: true //useful but not required
        });
        // catch issues and reconnect
        (async () => {
            for await (const s of nc.status()) {
                switch (s.data) {
                    case 'AUTHORIZATION_VIOLATION':
                    case 'AUTHENTICATION_EXPIRED':
                        // when one of the above happens, reconnect
                        connect()
                            .then(nc => doThis(nc))
                            .catch(error => console.error(error));
                        break;
                    default:
                }
            }
        })().then();
        return nc;
    } catch (error) {
        if(nc) await nc.close();
        throw new Error('Could not initiate listener - check configurations');
    }
}

async function callAPI(nc: any): Promise<void> {
    try {
        const sc = StringCodec();
        const js = await nc.jetstream();
        // THIS IS AN EXAMPLE - YOU WILL NEED TO CHANGE THIS CODE TO ACCOUNT FOR THE ACTUAL RESPONSE FROM YOUR API
        const response = await axios.get(configs.EXTERNAL_API, {
            headers: {
                'Authorization': `Bearer ${configs.EXTERNAL_API_TOKEN}`
            }
        });
        const data = response.data;
        const created = new Date();

        //ASSUMES THAT DATA IS AN ARRAY
        await Promise.all(data.map(async (d: any) => {
            const envelope = {
                created,
                type: configs.UE_STREAMS_EVENT_LABEL,
                data: d
            }
            await js.publish(configs.SUBJECT, sc.encode(JSON.stringify(envelope)));
            console.log('Data published:', envelope);
        }))
    } catch (error: any) {
        console.error('Error fetching data: ', error.message);
    }
}

async function doThis(nc: any) {
    setInterval(async () => {
        await callAPI(nc);
    }, 60*1000);
}

start()
.then((nc: any) => doThis(nc))
.catch((error: any) => console.error('SOMETHING WENT WRONG', error));