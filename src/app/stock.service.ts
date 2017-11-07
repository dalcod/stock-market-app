import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import {  } from '';

import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import * as io from 'socket.io-client';

@Injectable()
export class StockService {
    constructor(private http: Http) {}

    public names: any[];
    // ricordarsi che per creare una chart vuota è importante inserire un valore iniziale di default all'interno dell'opzione/array ".serires" ("{name: '', data: []}").
    public seriesOptions: any[] = [{name: '', data: []}];
    public counter: number = 0;
    public now: string = (new Date()).toJSON().split("T")[0]; // ottieni la data di oggi in formato 'anno-mese-giorno'.
    private url: string = 'http://localhost:3000';
    private socket: any;



    private handleError (error: Response | any) {
        let errMsg: string;
        if (error instanceof Response) {
            if (error.status === 0){
                errMsg = '429 - Too many requests. Please refresh the page.';
            } else {
                errMsg = error.status + ' - ' + error.statusText;
            }
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        return Promise.reject(errMsg);
    }

    public getStocks(): Promise<any[]> {
        return this.http.get('/stocks')
            .toPromise()
            .then(res => this.names = res.json())
            .catch(this.handleError);
    }

    public addStock(stockName: string): Promise<any> {

        // invia un oggetto al "web socket" emettendo un evento "new-obj" a cui il server risponderà con un'ulteriore evento che verrà 'osservato' dalla funzione "watchForData()" ed in base al quale quest'ultima effettuerà delle operazioni specifiche.
        // è necessario inviare oltre al nome anche il nuovo valore inserito in ".seriesOptions", ottenuto effettuando la richiesta all'API in modo tale che tutte le applicazioni connesse possano aggiornare la chart con i valori necessari, evitando di effettuare per ogni connessione una richiesta all'API.
        this.socket.emit('add-obj', {name: stockName, options: this.seriesOptions[this.seriesOptions.length - 1]});

        const headers = new Headers({'Content-Type': 'text/plain'});
        return this.http.post('/stock/' + stockName, '', {headers: headers})
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    // emetti un evento "delete-stockName" da inviare al socket passandvi il nome dell'azione e cancella quest'ultima dal server.
    public deleteFromServer(stockName: string): Promise<any> {

        this.socket.emit('delete-stockName', stockName);

        return this.http.delete('/stock/' + stockName)
            .toPromise()
            .then(res => res.json())
            .catch(this.handleError);
    }

    // cancella l'azione dall'array "this.names" e dall'array "this.seriesOptions".
    public deleteFromView(stockName: string) {
        this.names.forEach((doc, i) => {
            if (doc.name === stockName) {
                this.names.splice(i, 1);
            }
            // dato che che è inserito nell'array "seriesOptions" un'opzione di default 'vuota' è necessario aggiungere un "1" all'indice "i" per poterla saltare ed evitare bug, difatti "seriesOptions" possiede un elemento in più di "names" e visto che il loop viene eseguito su quest'ultimo bisogna aumentare l'indice di 1.
            if (this.seriesOptions[i + 1] === undefined) {
                return;
            }
            if (this.seriesOptions[i + 1].name === stockName) {
                this.seriesOptions.splice(i + 1, 1);
            }
        });
        this.names.filter(doc => doc !== undefined);
        this.seriesOptions.filter(obj => obj !== undefined);
    }
    
    // 'http client request', il parametro "multi" ci consente di capire se la funzione verrà utilizzata per effettuare una serie di richieste tramite loop, opppure solamente per una singola.
    public makeRequest(stockName: string, resolve: any, reject: any, multi?: boolean): Promise<any> {
        return this.http.get('https://www.quandl.com/api/v3/datasets/WIKI/' + stockName.toUpperCase() + '/data.json?&start_date=2014-08-01&end_date=' + this.now + '&column_index=1&api_key=RNMEFX5MNHhaw9yYB2yx')
            .toPromise()
            .then(res => {
            const data = res.json();
            const stockData: any[] = data.dataset_data.data;
            // converti le date degli elementi inseriti nell'array ritornato dal server, dal formato 'json' al formato 'milliseconds'. 
            stockData.forEach((arr, i) => {
                stockData[i][0] = Date.parse(arr[0]);
            });
            this.seriesOptions.push({
                name: stockName.toUpperCase(),
                data: stockData.reverse(), // il server ritorna l'array 'stockData' in ordine descrescente in base alla data, mentre 'highcharts' necessita che quest'ultimo sia in ordine crescente.
                color: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6) // crea colore casuale.
            });
            if (multi) {
                this.counter++;
                if (this.counter === this.names.length) {
                    resolve(true);
                } 
            } else {
                resolve(this.seriesOptions[this.seriesOptions.length - 1]);
            }
        }).catch(err => reject(err));
    }

    // La funzione è a prima vista abbastanza particolare rispetto alle altre in quanto contiene 2 "Promise", questo può rendere abbastanza difficile gestire gli errori perciò fare attenzione, a come, in caso di errore di una "Promise" situata all'interno, sia necessario 'catturarlo' con un metodo ".catch()" e passarlo come argomento alla callback "reject()", grazie a questa oprazione l'errore verrà passato alla "Promise" 'padre' ed ulteriormente catturato dal metodo ".catch()" ed ancora passato come argomento alla callback "this.handleError" la quale a sua volta ritornerà una 'rejection' ("Promise.reject(errMsg)") come avvenuto con la "Promise" 'figlio'.
    // è necessario quando si hanno molte richieste come potrebbe essere nel caso vi sino 6 o più azioni inserite nell'applicazione utilizzare un metodo per ritardare le richieste le une dalle altre o meglio, di 'scaglionarle', in modo tale che i server dell'API non lancino un errore '429 - too many requests', ed è per questo motivo che viene utilizzata la funzione "setTimeout()" all'interno del loop.
    public fetchData(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getStocks().then(names => {
                this.names = names;
                const self = this;
                this.names.forEach((obj: any, i: number) => {
                    (function(){
                        setTimeout(function(){ self.makeRequest(obj.name, resolve, reject, true);}, 300 * i);
                    })();
                });
            });
        }).catch(this.handleError);
    }

    // come sopra, unica differenza è che la funzione viene utilizzata per effettuare solamente una richiesta.
    public insertNewData(stock: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.makeRequest(stock, resolve, reject);
        }).catch(this.handleError);
    }
    
    // funzione che gestisce in sintesi i dati in 'entrata' inviati dal server attraverso i 'web-socket', questi ultimi vengono filtrati in base al tipo di evento emesso in questo caso 'new-obj' oppure 'remove-stockName'. Nel momento in cui riceveremo i dati la funzione invierà a sua volta questi ultimi a chiunque stia osservando (.subscribe()).
    public watchForData() {
        let observable = new Observable<any>((observer: Observer<any>) => {
            this.socket = io(this.url);
            this.socket.on('new-obj', (data: any) => {
                observer.next(data);
            });
            this.socket.on('remove-stockName', (data: any) => {
                observer.next(data);
            });
            return () => {
                this.socket.disconnect();
            };
        });
        return observable;
    }
    
    // la funzione filtra l'array di nomi "this.names" e controlla se il nome dell'azione passato come paramentro sia presente o meno.
    public checkIfPresent(stockName: string): boolean {
        let a = false;
        this.names.forEach(obj => {
            if (obj.name === stockName) {
                a = true;
            }
        });
        return a;
    }

    // aggiungi la proprietà ".price" a tutti gli oggetti presenti nell'array "names", a quest'ultima verrà assegnato l'ultimo prezzo disponibile per quella determinata azione.
    public augmentNames(): any[] {
        for (let i = 0; i < this.names.length; i++) {
            for (let j = 0; j < this.seriesOptions.length; j++) {
                if (this.names[i].name === this.seriesOptions[j].name) {
                    this.names[i].price = this.seriesOptions[j].data[this.seriesOptions[j].data.length - 1][1];
                }
            }
        }
        return this.names;
    }

    // la funzione ritorna un oggetto contenente tutte le opzioni necessarie per costruire la chart.
    public setChartOptions(): any {
        let options: any = {};
        return options = {
            title: { text: 'Stock Prices' },
            series: this.seriesOptions,
            chart: { zoomType: 'x'},
            rangeSelector: {
                selected: 4,
                enabled: false
            },
            yAxis: {
                labels: {
                    formatter: function () {
                        return (this.value > 0 ? ' + ' : '') + this.value + '%';
                    }
                },
                plotLines: [{
                    value: 0,
                    width: 2,
                    color: 'silver'
                }]
            },
            plotOptions: {
                series: {
                    compare: 'percent',
                    showInNavigator: true
                }
            },
            tooltip: {
                pointFormat: '<span style="color:${series.color}">${series.name}</span>: <b>${point.y}</b> (${point.change}%)<br/>',
                valueDecimals: 2,
                split: true
            }
        };
    };

}