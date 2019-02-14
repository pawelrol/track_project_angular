import { Component, ViewChild, Input, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';

import { BaseGridComponent, StateStorageEndpoint } from 'app/shared';
import { DroppableRowDirective, DraggableRowDirective, DndFlowManager } from 'app/shared/drag-and-drop';


declare var jQuery: any;
const gridKey = 'detail_grid';

@Component({
    selector: 'ht-detail-grid',
    templateUrl: './detail-grid.component.html',
    styleUrls: ['./detail-grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class DetailGridComponent extends BaseGridComponent {
    public selectFirstRow: boolean;
    public GridKey = gridKey;
    @ViewChild('detailsGrid') GridComponent: DxDataGridComponent;
    @ViewChild(DroppableRowDirective) Droppable: DroppableRowDirective;
    @ViewChild(DraggableRowDirective) Draggable: DraggableRowDirective;

    @Input() DataSource: any;
    @Input() DetailsDataSourceFactory: (id) => any;
    @Input() DndFlowManager: DndFlowManager;

    @Output() changeDetailEvent = new EventEmitter();

    constructor(stateStorageEndpoint: StateStorageEndpoint) {
        super(stateStorageEndpoint);
    }
    saveState = (s) => {
        this.SaveGridState(s);
    }

    onContentReady(e) {
        super.onContentReady(e);
        this.changeDetailEvent.emit(e);
    }

    onRowPrepared(element) {
        this.Droppable.RegisterRow(element);
        this.Draggable.RegisterRow(element);
    }
    onDetailsRowPrepared(element) {
        this.Draggable.RegisterRow(element, 'point-package');
    }
}
