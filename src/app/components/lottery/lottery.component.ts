import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {GethContractService} from '../../services/geth-contract/geth-contract.service';
import {GethConnectService} from '../../services/geth-connect/geth-connect.service';
import {Connected} from '../../services/geth-connect/connected';
import {StorageService} from '../../services/storage/storage.service';

@Component({
    selector: 'app-lottery',
    templateUrl: './lottery.component.html',
    styleUrls: ['./lottery.component.scss']
})

export class LotteryComponent implements OnInit, OnDestroy {

    private getConnectedListener: any;
    private _lottery: any;
    public lotteryAddress: string;
    public lotteryData: any;
    public accounts: Array<any>;
    public isConnected: Connected;
    public playErrorMessage: string;
    public playSuccessMessage: any;
    public isContractLoaded = false;
    public bets = ['a', 'b', 'c', 'd', 'e', 'f', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    public lotteryBets = [];
    public isWinner: boolean;
    public withdrawMessage: string;
    public isBetValid = false;

    /**
     *
     * @param activatedRoute
     * @param {GethContractService} contractService
     * @param {GethConnectService} connectService
     * @param {StorageService} storage
     */
    constructor(private activatedRoute: ActivatedRoute,
                private contractService: GethContractService,
                private connectService: GethConnectService,
                private storage: StorageService) {
    }

    public withdraw(account, gas) {
        this._lottery.withdraw(({from: account, gas: gas}), (error, withdraw) => {
            if (!error) {
                this.withdrawMessage = withdraw;
            } else {
                this.withdrawMessage = error;
            }
        })
    }

    public checkResult(result) {
        this.lotteryBets.forEach(bet => {
            result === '0x' + bet.bet ? this.isWinner = true : this.isWinner = false;
        })
    }

    public setJackpot() {
        // this.lotteryData.jackpot = this.lotteryData.total / (this.lotteryData.ownerFee / 100);
    }

    private onPlaySuccess(result, _bet) {
        this.playErrorMessage = '';
        this.lotteryBets.push({
            blockNumber: null,
            blockHash: null,
            newHash: result,
            bet: _bet
        });
        this.storage.set(this.lotteryAddress, this.lotteryBets);
        this.playSuccessMessage = 'Your bet is made: ' + _bet + '! you can have more info by clicking below '
    }

    private onPlayError(errorMessage) {

        const userDenied = errorMessage.message.indexOf('User denied transaction signature');
        const unknownAddress = errorMessage.message.indexOf('Unknown address');
        if (userDenied > 0) {
            return String('You need to ACCEPT the payment request on MetaMask to continue');
        } else if (unknownAddress > 0) {
            return String('Unknown address, please unlock your account on MetaMask');
        } else {
            return (errorMessage);
        }
    }

    public play(account, gas, bet1, bet2) {

        if (bet1 === '$' || bet2 === '$') {
            this.isBetValid = true;
            return;
        }
        const _bet = bet1 + bet2;
        this.isBetValid = false;

        this._lottery.play(_bet, {from: account, value: this.lotteryData.fee, gas: gas}, (error, result) => {
            if (error) {
                this.playErrorMessage = this.onPlayError(error);
            } else {
                this.onPlaySuccess(result, _bet);
            }
        });
    }

    private updateLotteryBets() {
        this.lotteryBets.forEach(bet => {
            console.log(bet.newHash);
        });
    }

    private updateContractTotal(total) {
        this.lotteryData.total = total.args.total;
    }

    private updateContractResult(result) {
        this.lotteryData.result = result.args.result;
        this.checkResult(result);
    }

    private updateContractOpen(open) {
        this.lotteryData.open = open.args.open;
    }

    private setListeners() {

        this._lottery.Total((error, total) => {
            if (!error) {
                this.updateContractTotal(total);
            }
        });

        this._lottery.Result((error, result) => {
            if (!error) {
                this.updateContractResult(result);
            }
        });

        this._lottery.Open((error, open) => {
            if (!error) {
                this.updateContractOpen(open);
            }
        });
    }

    private getAccounts() {
        return window.web3.eth.getAccounts((error, accounts) => {
            if (!error) {
                this.accounts = accounts;
                if (accounts.length === 0) {
                    alert('Please unlock your account and refresh this page');
                }
            }
        });
    }

    private loadLotteryBets() {
        this.storage.get(this.lotteryAddress).then(bets => {
            this.lotteryBets = bets;
            if (!bets) {
                this.lotteryBets = [];
            }
        });
    }

    private loadLottery() {
        this._lottery = this.contractService.getContract(this.lotteryAddress);
        this.contractService.getContractData(this._lottery).then(data => {
            this.lotteryData = data;
            this.setListeners();
            this.getAccounts();
            this.loadLotteryBets();
            this.setJackpot();
        });

        // this._lottery.block_result((error, block_result) => {
        //     if (error) {
        //         console.log(error)
        //     }
        //     console.log(block_result);
        // });
    }

    bootstrap() {
        this.isContractLoaded = false;

        // This listener will be updated every second.
        this.getConnectedListener = this.connectService.getConnected().subscribe(connected => {
            this.isConnected = connected;
            if (connected && !this.isContractLoaded) {
                this.loadLottery();
                this.isContractLoaded = !this.isContractLoaded;
            }
        });
    }

    ngOnInit() {
        this.activatedRoute.params.subscribe((params: Params) => {
            this.lotteryAddress = params['address'];
            this.bootstrap();
        });
    }

    ngOnDestroy() {
        this.getConnectedListener.unsubscribe();
    }
}
