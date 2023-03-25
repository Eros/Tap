# Tap

A very small util for obtaining information from MC servers.

# Usage

```typescript
import {Tap} from "./Tap";

async function test1(domain: string) {
    try {
        const server = new Tap(domain, 5_000);
        const info = await server.fetchServerInfo();

        console.log(`Name: ${serverInfo.name}`);
        console.log(`Player count: ${serverInfo.playerCount}`);
        console.log(`MOTD: ${serverInfo.motd}`);
        console.log(`Supported versions: ${serverInfo.version}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

async function test2() {
    try {
        const server = new Tap(null, 5_000);
        const info = await server.fetchServerInfoFromAddressAndPort('123.456.789', 25665);
        
        console.log(`Name: ${serverInfo.name}`);
        console.log(`Player count: ${serverInfo.playerCount}`);
        console.log(`MOTD: ${serverInfo.motd}`);
        console.log(`Supported versions: ${serverInfo.version}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}
```