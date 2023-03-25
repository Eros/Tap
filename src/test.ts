import {getServerInformation, getServerInformationFromDns} from './tap'

getServerInformation('player.example.com')
    .then((serverInfo) => {
        console.log(`Name: ${serverInfo.name}`);
        console.log(`Player Count: ${serverInfo.playerCount}`);
        console.log(`MOTD: ${serverInfo.motd}`);
        console.log(`Versions: ${serverInfo.version}`);
    })
    .catch((error) => {
        console.error(`Error ${error}`);
    });

getServerInformationFromDns('mc.hypixel.net')
    .then((serverInfo) => {
        console.log(`Name: ${serverInfo.name}`);
        console.log(`Player Count: ${serverInfo.playerCount}`);
        console.log(`MOTD: ${serverInfo.motd}`);
        console.log(`Versions: ${serverInfo.version}`);
    })
    .catch((error) => {
        console.error(`Error ${error}`);
    });