import {ServerInfo} from "./impl/ServerInfo";
import * as net from "net";
import * as dns from "dns";
import * as dnsPromises from 'dns/promises'

export class Tap {

    private readonly domain: string;
    private readonly timeout: number;

    /**
     * @param domain of the server to get the information from.
     * @param timeout before the attempts will fail.
     */
    constructor(domain: string, timeout: number) {
        this.domain = domain;
        this.timeout = timeout;
    }

    /**
     * Gets the server information from the
     * domain name provided in the constructor.
     * @return {@link ServerInfo}
     */
    public async fetchServerInfo(): Promise<ServerInfo> {
        const {address, port} = await this.resolveDomain();
        return await this.getServerInformation(address, port);
    }

    /**
     * Gets the server information form a manually specified
     * port and address rather than specifying a domain
     * and a port.
     * @param address
     * @param port
     * @return {@link ServerInfo}
     */
    public async _fetchServerInfo(address: string, port: number): Promise<ServerInfo> {
        return await this.getServerInformation(address, port);
    }

    /**
     * Runs through the server information provided and
     * creates a socket that will send a packet to the
     * server pretending to be the server list ping request.
     * @param address to get the information from.
     * @param port to attach to.
     */
    private async getServerInformation(address: string, port: number): Promise<ServerInfo> {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();

            socket.setTimeout(5_000);

            socket.on('data', (data) => {
                const serverInfo = this.parseServerInfo(data);

                const info: ServerInfo = {
                    name: address,
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

            socket.connect(port, address, () => {
                socket.write(Buffer.concat([
                    Buffer.from([0xFE, 0x01]),
                    Buffer.alloc(12, 0x00)
                ]));
            });
        });
    }

    /**
     * Takes a domain name and attempts to resolve the
     * record into the IP address and the port address.
     * @return the address and the port.
     */
    private async resolveDomain(): Promise<{ address: string; port: number }> {
        const srvPromise = dnsPromises.resolveSrv(`_minecraft._tcp.${this.domain}`);
        const ipPromise = dnsPromises.resolve4(this.domain);

        // Create a timeout that will reject after the specified time.
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), this.timeout);
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

    private parseServerInfo(data: Buffer): Record<string, string> {
        const payload = data.slice(5).toString('utf16le').split('\x00');
        const info: Record<string, string> = {};

        for (let i = 0; i < payload.length - 1; i += 2) {
            info[payload[i]] = payload[i + 1];
        }

        return info;
    }
}