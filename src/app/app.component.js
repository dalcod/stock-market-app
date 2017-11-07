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
var stock_service_1 = require("./stock.service");
var AppComponent = (function () {
    function AppComponent(sS, http) {
        this.sS = sS;
        this.http = http;
        this.names = [];
    }
    AppComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.httpErr = '';
        this.options = this.sS.setChartOptions();
        this.connection = this.sS.watchForData()
            .subscribe(function (obj) {
            if (obj.type === 'post') {
                // aggiorna array "names".
                _this.sS.names.push({ name: obj.json.name });
                // nel caso in cui non sia stata l'applicazione attuale ad effettuare la richiesta al server per una nuova azione allora sara necessario aggiornare l'array "seriesOptions" con i nuovi valori ottenuti dato che essi vengono inseriti nell'array al momento della richiesta, per chi effettua l'operazione, ma non per tutti gli altri utenti connessi, in quanto questo andrebbe a sovraccaricaricare di richieste i server dell'API nel caso vi siamo molti utenti, rischiando di causare errori. Perciò come faremo a distiguere l'array degli utenti che non hanno effettuato la richiesta da quella che l'ha effettuata? Semplicemente controllando che la lunghezza dell'array "seriesOptions" combaci con quella dell'array "names", se così non fosse allora sarà necessario inserie i nuovi dati.
                if (_this.sS.seriesOptions.length - 1 !== _this.sS.names.length) {
                    _this.sS.seriesOptions.push(obj.json.options);
                }
            }
            if (obj.type === 'delete') {
                _this.sS.deleteFromView(obj.name);
            }
            _this.names = _this.sS.augmentNames();
            _this.refreshChart();
        });
        this.sS.fetchData().then(function () {
            // la proprietà "this.names" verrà utilizzata dal "template" per costruire gli elementi che andranno ad indicare le varie azioni inserite.
            _this.names = _this.sS.augmentNames();
            // console.log(this.names)
            _this.refreshChart();
        }, function (err) { return _this.httpErr = err; });
    };
    AppComponent.prototype.ngOnDestroy = function () {
        this.connection.unsubscribe();
    };
    AppComponent.prototype.refreshChart = function () {
        this.options = this.sS.setChartOptions();
    };
    AppComponent.prototype.onNewStock = function (stock) {
        var _this = this;
        this.sS.addStock(stock)
            .then(function () { return null; }, function (err) { return _this.httpErr = err; });
    };
    AppComponent.prototype.delete = function (stock) {
        var _this = this;
        this.sS.deleteFromServer(stock)
            .then(function () {
            _this.sS.deleteFromView(stock);
            _this.names = _this.sS.augmentNames();
            _this.refreshChart();
        }, function (err) { return _this.httpErr = err; });
    };
    return AppComponent;
}());
AppComponent = __decorate([
    core_1.Component({
        selector: 'my-app',
        templateUrl: './app.component.html',
        styleUrls: ['./app.component.css']
    }),
    __metadata("design:paramtypes", [stock_service_1.StockService, http_1.Http])
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map