import {Tap} from "./tap";

async function testInfo(domain: string) {
    try {
        const server = new Tap(domain, 5_000);
        const serverInfo = await server.fetchServerInfo();

        console.log(`Name: ${serverInfo.name}`);
        console.log(`Player count: ${serverInfo.playerCount}`);
        console.log(`MOTD: ${serverInfo.motd}`);
        console.log(`Supported versions: ${serverInfo.version}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

testInfo('mc.hypixel.net');