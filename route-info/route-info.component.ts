import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'ht-route-info',
    templateUrl: './route-info.component.html',
    styleUrls: ['./route-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.Default,
    encapsulation: ViewEncapsulation.None
})
export class RouteInfoComponent {

    @Input()
    public get selectedRouteRow(): any {
        return this._selectedRouteRow;
    }
    public set selectedRouteRow(value: any) {
        this._selectedRouteRow = value;
    }

    private _selectedRouteRow: any;

    constructor() { }


    progressBar_StatusFormat(row) {
        return '';
    }

    progressBar_Class() {

    let css = 'pusto';
        if (this._selectedRouteRow) {
            css = 'ht-green';
            if (this._selectedRouteRow.truckPercentOccupancy > 60) {
                css = 'ht-orange';
            }
            if (this._selectedRouteRow.truckPercentOccupancy >= 90) {
                css = 'ht-red';
            }
        } else {}

    return css;
    }
}
