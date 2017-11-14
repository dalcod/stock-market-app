import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockService } from './stock.service';

@Component({
    selector: 'input-elem',
    templateUrl: './input.component.html',
    styleUrls: ['./input.component.css']
})

export class InputComponent {
    constructor(private sS: StockService, private fb: FormBuilder) {
        this.createForm().valueChanges
            .subscribe(data => this.onValueChanges(data));
    }

    public errMsg: string;
    public inGroup: FormGroup;
    public formErrors = {
        name: ''
    };
    public validationMessages = {
        'name': {
            'pattern': 'Stock names can contain only letters',
            'exist': 'This stock already exists',
            'notExist': 'Please enter a valid stock name'
        }
    };

    @Output() onClick = new EventEmitter<string>();

    public createForm(): FormGroup {
        return this.inGroup = this.fb.group({
            name: ['', Validators.compose([Validators.pattern(/^[a-zA-Z]+$/)])]
        });
    }

    public onValueChanges(data: any) {
        if (!this.inGroup) { return; }
        const form = this.inGroup;
        for (let field in this.formErrors) {
            this.formErrors[field] = '';
            const control = form.get(field);
            if (control && control.dirty && !control.valid) {
                this.errMsg = '';
                const messages = this.validationMessages[field];
                for (let key in control.errors) {
                    this.formErrors[field] += messages[key] + ' ';
                }
            }
        }
    }

    public onSubmit(stockObj: any) {
        const stockName = stockObj.name.toUpperCase();
        // resetta il campo input.
        this.inGroup.reset();
        if (this.sS.checkIfPresent(stockName)) {
            this.errMsg = this.validationMessages.name.exist;
            return;
        }
        this.errMsg = '';
        this.sS.insertNewData(stockName)
            .then(() => {
            // è importante esequire l'operazione nella riga sotto solo se il nome dell'azione inserita è valida e quindi la "Promise" può essere 'risolta'.
            // inviamo al componente 'padre' "AppComponent" il valore appena sottomesso nel campo input.
            this.onClick.emit(stockName);
        },
                  err => this.errMsg = this.validationMessages.name.notExist);
    }
}
