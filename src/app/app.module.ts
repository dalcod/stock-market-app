import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { ChartModule } from 'angular2-highcharts';
import { HighchartsStatic } from 'angular2-highcharts/dist/HighchartsService';

import { StockService } from './stock.service';

import { AppComponent } from './app.component';
import { InputComponent } from './input.component';

export function highchartsFactory() {
    return require('highcharts/highstock');
}

@NgModule({
    imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpModule,
        ChartModule
    ],
    declarations: [
        AppComponent,
        InputComponent
    ],
    providers: [ StockService, {
        provide: HighchartsStatic,
        useFactory: highchartsFactory
    } ],
    bootstrap: [ AppComponent ]
})

export class AppModule { }