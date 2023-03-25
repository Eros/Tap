import * as net from "net";
import {ServerInfo} from "./impl/ServerInfo";
import * as dns from "dns";
import * as dnsPromises from 'dns/promises'

/**
 * Gets the servers information from a dns name rather
 * than using a specified IP address and port, uses the
 * {@link resolveDomain} method to try and find the servers
 * IP & port.
 *
 * @param dnsName to get the information from.
 */
export async function getServerInformationFromDns(dnsName: string): Promise<ServerInfo> {
    const dnsInfo = resolveDomain(dnsName);

    return getServerInformation(dnsInfo[0], dnsInfo[1]);
}

/**
 * Takes in the dns name of a server
 * and resolves it to obtain the
 * servers IP address and the port.
 * Defaults the port to 25565
 * if it cannot find it.
 *
 * @param domain to search and get the address from.
 * @param timeout the amount of time that it will
 *                attempt to get the information from
 *                before failing.
 */
async function resolveDomain(domain: string, timeout: number = 5000): Promise<{address: string; port: number}> {
    const srvPromise = dnsPromises.resolveSrv(`_minecraft._tcp.${domain}`);
    const ipPromise = dnsPromises.resolve4(domain);

    // Create a timeout that will reject after the specified time.
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), timeout);
    });

    try {
        // Attempt to resolve the SRV record, if successful return
        // the servers address and port from the SRV record.
        const srvResult: dns.SrvRecord[] = await Promise.race([srvPromise, timeoutPromise]);
        return {
            address: srvResult[0].name,
            port: srvResult[0].port,
        };
    } catch (error) {
        // If the error is due to a time out there's
        // not much else to do so throw the error.
        if (error.message === 'Request timed out') {
            throw error;
        }

        // If the SRV record resolution failed for any reason then attempt
        // to resolve the A record (IPv4) and default the port to 25565.
        const ipAddress: string[] = await Promise.race([ipPromise, timeoutPromise]);
        return {
            address: ipAddress[0],
            port: 25565,
        };
    }
}

/**
 * Sends a ping to the server and get the
 * information from the required data,
 * sends the ping by telling the server
 * that it's sending the 'Server List Ping' packet.
 * @param serverAddress to send the data to.
 * @param port to attach to.
 * @return {@link ServerInfo} with all provided data.
 */
export async function getServerInformation(serverAddress: string, port: number = 25565): Promise<ServerInfo> {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();

        socket.setTimeout(5_000);

        socket.on('data', (data) => {
            const serverInfo = parseServerInfo(data);

            const info: ServerInfo = {
                name: serverAddress,
                playerCount: parseInt(serverInfo['player_0'], 10),
                motd: serverInfo['description'],
                version: serverInfo['version']
            }

            resolve(info);
            socket.end();
        });

        socket.on('timeout', () => {
            reject(new Error('Request timed out'));
            socket.end();
        });

        socket.on('error', (err) => reject(err));

        socket.connect(port, serverAddress, () => {
            socket.write(Buffer.concat([
                Buffer.from([0xFE, 0x01]),
                Buffer.alloc(12, 0x00)
            ]));
        });
    });
}

function parseServerInfo(data: Buffer): Record<string, string> {
    const payload = data.slice(5).toString('utf16le').split('\x00');
    const info: Record<string, string> = {};

    for (let i = 0; i < payload.length - 1; i += 2) {
        info[payload[i]] = payload[i + 1];
    }

    return info;
}