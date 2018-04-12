import {Injectable} from '@angular/core';
import {abiManager} from './abi-manager';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {ConnectService} from '../connect/connect.service';

@Injectable()
export class ContractManagerService {

    private _event: Subject<any> = new Subject<any>();

    private managerAddress = {
        test: "0x863ed074ff47e9551f8c7162f933bcfdaa7be8f4", // "0xf337a12db1b712526c5e0c12545d97e4dbeab746", // "0x863ed074ff47e9551f8c7162f933bcfdaa7be8f4",
        main: "0x863ed074ff47e9551f8c7162f933bcfdaa7be8f4" // "0x863ed074ff47e9551f8c7162f933bcfdaa7be8f4"
    };
    private managerData: any;

    /**
     *
     * @param {ConnectService} _connectService
     */
    constructor(private _connectService: ConnectService) {
    }

    /**
     *
     * @param event
     */
    private broadcastEvent(event): void {
        this._event.next(event);
    }

    public listenEvent(): Observable<any> {
        return this._event.asObservable();
    }

    private setListeners() {
        this.managerData.Register().watch((error, event) => {
            if (!error) {
                this.broadcastEvent(event);
            }
        });
    }

    /**
     *
     * @param {number} network
     * @return {any}
     */
    private makeManagerAddress(network) {
        if (network === '31') {
            return this.managerAddress.test;
        } else if (network === '30') {
            return this.managerAddress.main;
        }
    }

    private makeManagerObject() {
        this.managerData = this._getContractForAddress(this.managerAddress.main);
        return this.managerData;
    }

    /**
     *
     * @param {String} contractAddress
     */
    private _getContractForAddress(contractAddress) {
        const manager = window.web3.eth.contract(abiManager);
        return manager.at(contractAddress);
    }


    private getLotteries(manager) {
        return new Promise(resolve => {
            manager.lotteries((error, lotteries) => {
                resolve(lotteries);
            });
        });
    }

    /**
     *
     * @return {Promise<Array>}
     */
    private generateContractsList() {
        return new Promise(resolve => {
            const manager = this.makeManagerObject();
            this.getLotteries(manager).then(lotteries => {
                this.setListeners();
                resolve(lotteries);
            });
        });
    }

    public getCurrentContracts() {
        return this.generateContractsList();
    }
}
