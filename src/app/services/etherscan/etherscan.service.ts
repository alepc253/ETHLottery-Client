import {Http} from '@angular/http';
import {Injectable} from '@angular/core';
import {ConnectService} from '../connect/connect.service';

@Injectable()
export class EtherscanService {


    /**
     *
     * @param {ConnectService} _connectService
     * @param {Http} http
     */
    constructor(private _connectService: ConnectService,
                private http: Http) {
    }


    public get(url: string, params) {
        return this.http.get(url, {search: params});
    }

    private getNetwork() {
        return new Promise((resolve) => {
            window.web3.version.getNetwork((err, netId) => {
                if (!err) {
                    resolve(netId);
                }
            });
        });
    }

    makeUrlForAddress(address) {
        const network = this._connectService.getNetworkIdSync();
        const url = this.makeEtherScanUrl(network) + 'addr/' + address;
        return url;
    }

    public makeUrlForTx(address) {
        const network = this._connectService.getNetworkIdSync();
        const url = this.makeEtherScanUrl(network) + 'tx/' + address;
        return url;
    }

    /**
     *
     * @param {string} tx
     */
    public openTx(tx) {
        if (!tx) {
            return;
        }
        this.getNetwork().then(network => {
            window.open(this.makeEtherScanUrl(network) + 'tx/' + tx);
        });
    }

    /**
     *
     * @param {string} address
     */
    public openAddress(address) {
        if (!address) {
            return;
        }
        this.getNetwork().then(network => {
            window.open(this.makeEtherScanUrl(network) + 'address/' + address, '_blank');
        });
    }

    /**
     *
     * @param network
     * @return {string}
     */
    public makeEtherScanUrl(network) {
        const etherScanUrl = '//explorer.testnet.rsk.co/';
        const etherScanTestNetUrl = '//explorer.testnet.rsk.co/';
        if (network === '31') {
            return etherScanTestNetUrl;
        } else if (network === '30') {
            return etherScanUrl;
        }
    }

}
