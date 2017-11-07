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
var forms_1 = require("@angular/forms");
var stock_service_1 = require("./stock.service");
var InputComponent = (function () {
    function InputComponent(sS, fb) {
        var _this = this;
        this.sS = sS;
        this.fb = fb;
        this.formErrors = {
            name: ''
        };
        this.validationMessages = {
            'name': {
                'pattern': 'Stock names can contain only letters',
                'exist': 'This stock already exists',
                'notExist': 'Please enter a valid stock name'
            }
        };
        this.onClick = new core_1.EventEmitter();
        this.createForm().valueChanges
            .subscribe(function (data) { return _this.onValueChanges(data); });
    }
    InputComponent.prototype.createForm = function () {
        return this.inGroup = this.fb.group({
            name: ['', forms_1.Validators.compose([forms_1.Validators.pattern(/^[a-zA-Z]+$/)])]
        });
    };
    InputComponent.prototype.onValueChanges = function (data) {
        if (!this.inGroup) {
            return;
        }
        var form = this.inGroup;
        for (var field in this.formErrors) {
            this.formErrors[field] = '';
            var control = form.get(field);
            if (control && control.dirty && !control.valid) {
                this.errMsg = '';
                var messages = this.validationMessages[field];
                for (var key in control.errors) {
                    this.formErrors[field] += messages[key] + ' ';
                }
            }
        }
    };
    InputComponent.prototype.onSubmit = function (stockObj) {
        var _this = this;
        var stockName = stockObj.name.toUpperCase();
        // resetta il campo input.
        this.inGroup.reset();
        if (this.sS.checkIfPresent(stockName)) {
            this.errMsg = this.validationMessages.name.exist;
            return;
        }
        this.errMsg = '';
        this.sS.insertNewData(stockName)
            .then(function () {
            // è importante esequire l'operazione nella riga sotto solo se il nome dell'azione inserita è valida e quindi la "Promise" può essere 'risolta'.
            // inviamo al componente 'padre' "AppComponent" il valore appena sottomesso dal campo input.
            _this.onClick.emit(stockName);
        }, function (err) { return _this.errMsg = _this.validationMessages.name.notExist; });
    };
    return InputComponent;
}());
__decorate([
    core_1.Output(),
    __metadata("design:type", Object)
], InputComponent.prototype, "onClick", void 0);
InputComponent = __decorate([
    core_1.Component({
        selector: 'input-elem',
        templateUrl: './input.component.html',
        styleUrls: ['./input.component.css']
    }),
    __metadata("design:paramtypes", [stock_service_1.StockService, forms_1.FormBuilder])
], InputComponent);
exports.InputComponent = InputComponent;
//# sourceMappingURL=input.component.js.map