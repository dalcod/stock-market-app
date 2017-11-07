import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Http } from '@angular/http';
import {  } from '';

import 'rxjs/add/operator/toPromise';

import { StockService } from './stock.service';

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
    constructor(private sS: StockService, private http: Http) {
    }

    public httpErr: string;
    public names: any[] = [];
    @Input() options: Object;
    public connection: any;
    loading: boolean = true;

    public ngOnInit() {
        this.options = this.sS.setChartOptions();
        this.httpErr = '';
        this.connection = this.sS.watchForData()
            .subscribe(obj => {
            if(obj.type === 'post') {
                // aggiorna array "names".
                this.sS.names.push({name: obj.json.name});
                // nel caso in cui non sia stata l'applicazione attuale ad effettuare la richiesta al server per una nuova azione allora sarà necessario aggiornare l'array "seriesOptions" con i nuovi valori ottenuti dato che essi vengono inseriti nell'array al momento della richiesta, per chi effettua l'operazione, ma non per tutti gli altri utenti connessi, in quanto questo andrebbe a sovraccaricaricare di richieste i server dell'API nel caso vi siamo molti utenti, rischiando di causare errori. Perciò come faremo a distiguere l'array degli utenti che non hanno effettuato la richiesta da quella che l'ha effettuata? Semplicemente controllando che la lunghezza dell'array "seriesOptions" combaci con quella dell'array "names", se così non fosse allora sarà necessario inserie i nuovi dati.
                if (this.sS.seriesOptions.length - 1 !== this.sS.names.length){
                    this.sS.seriesOptions.push(obj.json.options);
                }
            }
            if (obj.type === 'delete') {
                this.sS.deleteFromView(obj.name);
            }
            this.names = this.sS.augmentNames();
            this.refreshChart();
        });

        this.sS.fetchData().then(() => {
            this.loading = false;
            // la proprietà "this.names" verrà utilizzata dal "template" per costruire gli elementi che andranno ad indicare le varie azioni inserite.
            this.names = this.sS.augmentNames();
            // console.log(this.names)
            this.refreshChart();
        },
                                 err => this.httpErr = err);
    }

    public ngOnDestroy() {
        this.connection.unsubscribe();
    }

    public refreshChart() {
        this.options = this.sS.setChartOptions();
    }

    public onNewStock(stock: string) {
        this.sS.addStock(stock)
            .then(() => null,
                  err => this.httpErr = err);
    }

    public delete(stock: string) {
        this.sS.deleteFromServer(stock)
            .then(() => {
            this.sS.deleteFromView(stock);
            this.names = this.sS.augmentNames();
            this.refreshChart()
        },
                  err => this.httpErr = err);
    }
}
