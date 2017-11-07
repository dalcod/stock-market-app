"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
require("rxjs/add/operator/toPromise");
var Observable_1 = require("rxjs/Observable");
var io = require("socket.io-client");
var StockService = (function () {
    function StockService(http) {
        this.http = http;
        // ricordarsi che per creare una chart vuota è importante inserire un valore iniziale di default all'interno dell'opzione/array ".serires" ("{name: '', data: []}").
        this.seriesOptions = [{ name: '', data: [] }];
        this.counter = 0;
        this.now = (new Date()).toJSON().split("T")[0]; // ottieni la data di oggi in formato 'anno-mese-giorno'.
        this.url = 'http://localhost:3000';
    }
    StockService.prototype.handleError = function (error) {
        var errMsg;
        if (error instanceof http_1.Response) {
            if (error.status === 0) {
                errMsg = '429 - Too many requests. Please refresh the page.';
            }
            else {
                errMsg = error.status + ' - ' + error.statusText;
            }
        }
        else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.log(error);
        return Promise.reject(errMsg);
    };
    StockService.prototype.getStocks = function () {
        var _this = this;
        return this.http.get('/stocks')
            .toPromise()
            .then(function (res) { return _this.names = res.json(); })
            .catch(this.handleError);
    };
    StockService.prototype.addStock = function (stockName) {
        // invia un oggetto al "web socket" emettendo un evento "new-obj" a cui il server risponderà con un'ulteriore evento che verrà 'osservato' dalla funzione "watchForData()" ed in base al quale quest'ultima effettuerà delle operazioni specifiche.
        // è necessario inviare oltre al nome anche il nuovo valore inserito in ".seriesOptions", ottenuto effettuando la richiesta all'API in modo tale che tutte le applicazioni connesse possano aggiornare la chart con i valori necessari, evitando di effettuare per ogni connessione una richiesta all'API.
        this.socket.emit('add-obj', { name: stockName, options: this.seriesOptions[this.seriesOptions.length - 1] });
        var headers = new http_1.Headers({ 'Content-Type': 'text/plain' });
        return this.http.post('/stock/' + stockName, '', { headers: headers })
            .toPromise()
            .then(function (res) { return res.json(); })
            .catch(this.handleError);
    };
    // emetti un evento "delete-stockName" da inviare al socket passandvi il nome dell'azione e cancella quest'ultima dal server.
    StockService.prototype.deleteFromServer = function (stockName) {
        this.socket.emit('delete-stockName', stockName);
        return this.http.delete('/stock/' + stockName)
            .toPromise()
            .then(function (res) { return res.json(); })
            .catch(this.handleError);
    };
    // cancella l'azione dall'array "this.names" e dall'array "this.seriesOptions".
    StockService.prototype.deleteFromView = function (stockName) {
        var _this = this;
        this.names.forEach(function (doc, i) {
            if (doc.name === stockName) {
                _this.names.splice(i, 1);
            }
            // dato che che è inserito nell'array "seriesOptions" un'opzione di default 'vuota' è necessario aggiungere un "1" all'indice "i" per poterla saltare ed evitare bug, difatti "seriesOptions" possiede un elemento in più di "names" e visto che il loop viene eseguito su quest'ultimo bisogna aumentare l'indice di 1.
            if (_this.seriesOptions[i + 1] === undefined) {
                return;
            }
            if (_this.seriesOptions[i + 1].name === stockName) {
                _this.seriesOptions.splice(i + 1, 1);
            }
        });
        this.names.filter(function (doc) { return doc !== undefined; });
        this.seriesOptions.filter(function (obj) { return obj !== undefined; });
    };
    // 'http client request', il parametro "multi" ci consente di capire se la funzione verrà utilizzata per effettuare una serie di richieste tramite loop, opppure solamente per una singola.
    StockService.prototype.makeRequest = function (stockName, resolve, reject, multi) {
        var _this = this;
        return this.http.get('https://www.quandl.com/api/v3/datasets/WIKI/' + stockName.toUpperCase() + '/data.json?&start_date=2014-08-01&end_date=' + this.now + '&column_index=1&api_key=RNMEFX5MNHhaw9yYB2yx')
            .toPromise()
            .then(function (res) {
            var data = res.json();
            var stockData = data.dataset_data.data;
            // converti le date degli elementi inseriti nell'array ritornato dal server, dal formato 'json' al formato 'milliseconds'. 
            stockData.forEach(function (arr, i) {
                stockData[i][0] = Date.parse(arr[0]);
            });
            _this.seriesOptions.push({
                name: stockName.toUpperCase(),
                data: stockData.reverse(),
                color: '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6) // crea colore casuale.
            });
            if (multi) {
                _this.counter++;
                if (_this.counter === _this.names.length) {
                    resolve(true);
                }
            }
            else {
                resolve(_this.seriesOptions[_this.seriesOptions.length - 1]);
            }
        }).catch(function (err) { return reject(err); });
    };
    // La funzione è a prima vista abbastanza particolare rispetto alle altre in quanto contiene 2 "Promise", questo può rendere abbastanza difficile gestire gli errori perciò fare attenzione, a come, in caso di errore di una "Promise" situata all'interno, sia necessario 'catturarlo' con un metodo ".catch()" e passarlo come argomento alla callback "reject()", grazie a questa oprazione l'errore verrà passato alla "Promise" 'padre' ed ulteriormente catturato dal metodo ".catch()" ed ancora passato come argomento alla callback "this.handleError" la quale a sua volta ritornerà una 'rejection' ("Promise.reject(errMsg)") come avvenuto con la "Promise" 'figlio'.
    // è necessario quando si hanno molte richieste come potrebbe essere nel caso vi sino 6 o più azioni inserite nell'applicazione utilizzare un metodo per ritardare le richieste le une dalle altre o meglio, di 'scaglionarle', in modo tale che i server dell'API non lancino un errore '429 - too many requests', ed è per questo motivo che viene utilizzata la funzione "setTimeout()" all'interno del loop.
    StockService.prototype.fetchData = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getStocks().then(function (names) {
                _this.names = names;
                var self = _this;
                _this.names.forEach(function (obj, i) {
                    (function () {
                        setTimeout(function () { self.makeRequest(obj.name, resolve, reject, true); }, 100 * i);
                    })();
                });
            });
        }).catch(this.handleError);
    };
    // come sopra, unica differenza è che la funzione viene utilizzata per effettuare solamente una richiesta.
    StockService.prototype.insertNewData = function (stock) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.makeRequest(stock, resolve, reject);
        }).catch(this.handleError);
    };
    // funzione che gestisce in sintesi i dati in 'entrata' inviati dal sever attraverso i 'web-socket', questi ultimi vengono filtrati in base al tipo di evento emesso in questo caso 'new-obj' oppure 'remove-stockName'. Nel momento in cui riceveremo i dati la funzione invierà a sua volta questi ultimi a chiunque stia osservando (.subscribe()).
    StockService.prototype.watchForData = function () {
        var _this = this;
        var observable = new Observable_1.Observable(function (observer) {
            _this.socket = io(_this.url);
            _this.socket.on('new-obj', function (data) {
                observer.next(data);
            });
            _this.socket.on('remove-stockName', function (data) {
                observer.next(data);
            });
            return function () {
                _this.socket.disconnect();
            };
        });
        return observable;
    };
    // la funzione filtra l'array di nomi "this.names" e controlla se il nome dell'azione passato come paramentro sia presente o meno.
    StockService.prototype.checkIfPresent = function (stockName) {
        var a = false;
        this.names.forEach(function (obj) {
            if (obj.name === stockName) {
                a = true;
            }
        });
        return a;
    };
    // aggiungi la proprietà ".price" a tutti gli oggetti presenti nell'array "names", a quest'ultima verrà assegnato l'ultimo prezzo disponibile per quella determinata azione.
    StockService.prototype.augmentNames = function () {
        for (var i = 0; i < this.names.length; i++) {
            for (var j = 0; j < this.seriesOptions.length; j++) {
                //console.log(this.names[i].name, this.seriesOptions[j].name)
                if (this.names[i].name === this.seriesOptions[j].name) {
                    this.names[i].price = this.seriesOptions[j].data[this.seriesOptions[j].data.length - 1][1];
                }
            }
        }
        return this.names;
    };
    // la funzione ritorna un oggetto contenente tutte le opzioni necessarie per costruire la chart.
    StockService.prototype.setChartOptions = function () {
        var options = {};
        return options = {
            title: { text: 'Stock Prices' },
            series: this.seriesOptions,
            chart: { zoomType: 'x' },
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
    ;
    return StockService;
}());
StockService = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.Http])
], StockService);
exports.StockService = StockService;
//# sourceMappingURL=stock.service.js.map