import { Component, ViewChild, Output, EventEmitter, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { BaseGridComponent, StateStorageEndpoint } from 'app/shared';
import { DraggableRowDirective, DndFlowManager, DroppableRowDirective } from 'app/shared/drag-and-drop';
import { ToastService } from 'app/services';

declare var jQuery: any;

@Component({
    selector: 'ht-route-or-package-grid',
    templateUrl: './route-or-package-grid.component.html',
    styleUrls: ['./route-or-package-grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class RouteOrPackageGridComponent extends BaseGridComponent {
    public selectFirstRow: boolean;
    highlight: boolean;

    public get GridKey() {
        if (this.packageTab) {
            return 'grid_planning_package';
        } else {
            return 'grid_planning_route';
        }
    }

    @ViewChild('routeGrid') GridComponent: DxDataGridComponent;
    @ViewChild(DraggableRowDirective) Draggable: DraggableRowDirective;
    @ViewChild(DroppableRowDirective) Droppable: DroppableRowDirective;

    @Input() DataSource: any;
    @Input() set packageTab(v: boolean) {
        if (this._packageTab !== v) {
            this._packageTab = v;
            this.LoadStateGrid();
        }
    }

    @Input() dcDataSource: any;

    @Input() selectedRouteId: number;
    @Input() DndFlowManager: DndFlowManager;

    @Output() SelectedRouteChanged = new EventEmitter<{
        selectedRouteId: number,
        selectedRouteRow: any
    }>();
    @Output() SelectedDCChanged = new EventEmitter();

    @Output() ChangeFiltrTab = new EventEmitter<boolean>();
    @Output() CloseRoute = new EventEmitter<{
        selectedRouteId: number
    }>();
    @Output() DeleteRoute = new EventEmitter<{
        selectedRouteId: number
    }>();
    @Output() AddRoute = new EventEmitter();


    get packageTab(): boolean { return this._packageTab; }

    rowIdSelectAfterRefresh = null;
    highlightAfterRefresh = false;
    forceSendEventAfterRefresh = null;
    private _packageTab = false;

    constructor(private translate: TranslateService, private toastService: ToastService, stateStorageEndpoint: StateStorageEndpoint) {
        super(stateStorageEndpoint);
    }

    saveState = (s) => {
        this.SaveGridState(s);
    }

    public DefaultSortAndScroll() {
        this.ClearColumnSettings();
        this.GridComponent.instance.columnOption('routeStatus', 'sortOrder', 'asc');
        this.GridComponent.instance.columnOption('id', 'sortOrder', 'desc');
        this.GridComponent.instance.pageIndex(0);
    }
    public RefreshAndSelect(id: number, highlight = false) {
        this.rowIdSelectAfterRefresh = id;
        this.highlightAfterRefresh = highlight;
        return this.RefreshData();
    }

    onContentReady(e) {
        const selectedKeys = this.GridComponent.selectedRowKeys;
        if (this.rowIdSelectAfterRefresh) {
            const id = this.rowIdSelectAfterRefresh;
            const highlight = this.highlightAfterRefresh;
            this.rowIdSelectAfterRefresh = null;
            this.highlightAfterRefresh = false;
            this.selectRow(id, true, highlight);
        } else if (!selectedKeys || selectedKeys.length === 0) {
            if (this.selectedRouteId) {
                this.selectRow(this.selectedRouteId, true);
            } else {
                this.selectRow(this.GridComponent.instance.getKeyByRowIndex(0));
            }

        }
        super.onContentReady(e);
    }
    onSelectionChanged(e) {
        if (!this.packageTab && !this.lockedRefresh) {
            let routId = null;
            let selectedRouteRow = null;
            if (e.selectedRowKeys && e.selectedRowKeys.length > 0) {
                routId = e.selectedRowKeys[0];
            }
            if (e.selectedRowsData && e.selectedRowsData.length > 0) {
                selectedRouteRow = e.selectedRowsData[0];
            }
            this.SelectedRouteChanged.emit({
                selectedRouteId: routId,
                selectedRouteRow: selectedRouteRow
            });
        }
    }
    onRowPrepared(element) {
        if (this.packageTab) {
            this.Draggable.RegisterRow(element);
        } else {
            this.Droppable.RegisterRow(element);
        }
    }
    onToolbarPreparing(e) {
        e.toolbarOptions.items.unshift(
            {
                location: 'before',
                widget: 'dxButton',
                options: {
                    icon: 'icon icon-refresh',
                    onClick: this.RefreshData.bind(this),
                    hint: this.translate.instant('hints.refresh')
                }
            },
            // {
            //     location: 'after',
            //     widget: 'dxTabs',
            //     options: {
            //         dataSource: [
            //             { id: 0, text: this.translate.instant('planningPage.routeGrid.package') },
            //             { id: 1, text: this.translate.instant('planningPage.routeGrid.routes') }
            //         ],
            //         selectedIndex: this.packageTab ? 0 : 1,
            //         onItemClick: this.onChangeFiltrTab.bind(this)
            //     }
            // },
            {
                location: 'after',
                template: 'distributionCenter',
            },
            {
                location: 'after',
                widget: 'dxSelectBox',
                options: {
                    dataSource: [
                        { id: 0, text: this.translate.instant('planningPage.routeGrid.package') },
                        { id: 1, text: this.translate.instant('planningPage.routeGrid.routes') }
                    ],
                    selectedIndex: this.packageTab ? 0 : 1,
                    valueExpr: 'id',
                    displayExpr: 'text',
                    onItemClick: this.onChangeFiltrTab.bind(this)
                }
            }
        );

        if (this.packageTab) {
            e.toolbarOptions.items[3].location = 'before';
            e.toolbarOptions.items[3].options.icon = 'icon icon-columns';
            e.toolbarOptions.items[5].location = 'before';
            e.toolbarOptions.items.splice(0, 0, e.toolbarOptions.items.splice(5, 1)[0]);
        } else {
            e.toolbarOptions.items.unshift(
                {
                    location: 'center',
                    widget: 'dxButton',
                    options: {
                        icon: 'fa fa-plus',
                        onClick: this.onAddRoute.bind(this),
                        hint: this.translate.instant('planningPage.routeGrid.addRoute')
                    }
                },
                {
                    location: 'center',
                    widget: 'dxButton',
                    options: {
                        icon: 'icon ht-red icon-erase',
                        onClick: this.onDeleteRoute.bind(this),
                        hint: this.translate.instant('planningPage.routeGrid.deleteRoute')
                    }
                },
                {
                    location: 'center',
                    widget: 'dxButton',
                    options: {
                        icon: 'icon icon-carProcessed',
                        onClick: this.onCloseRoute.bind(this),
                        hint: this.translate.instant('planningPage.routeGrid.forwardRoute')
                    }
                }
            );

            e.toolbarOptions.items[6].location = 'before';
            e.toolbarOptions.items[6].options.icon = 'icon icon-columns';
            e.toolbarOptions.items[7].location = 'before';
            e.toolbarOptions.items.splice(0, 0, e.toolbarOptions.items.splice(7, 1)[0]);
        }
    }

    onDCChangeValue(event) {
        this.SelectedDCChanged.emit(event);
    }

    onCloseRoute() {
        if (this.GridComponent) {
            const id = this.GridComponent.instance.getSelectedRowKeys()[0];
            this.CloseRoute.emit({ selectedRouteId: id });
        }
    }
    onAddRoute() {
        this.AddRoute.emit();
    }
    onDeleteRoute() {
        if (this.GridComponent) {
            const id = this.GridComponent.instance.getSelectedRowKeys()[0];
            this.DeleteRoute.emit({ selectedRouteId: id });
        }
    }
    onChangeFiltrTab(item) {
        const packageTab = item.itemData.id === 0;
        this.ChangeFiltrTab.emit(packageTab);
    }

    progressBar_Class(row) {
        let css = 'ht-green';
        if (row.value > 60) {
            css = 'ht-orange';
        }
        if (row.value >= 90) {
            css = 'ht-red';
        }
        return css;
    }
    progressBar_StatusFormat(row) {
        return '';
    }
    getStatusIcon(routeStatus: number) {
        switch (routeStatus) {
            case 0: return 'icon icon-processing';
            case 1: return 'icon icon-carEmpty';
            case 2: return 'icon icon-carNone red';
            case 3: return 'icon icon-carFull green';
            case 4: return 'icon icon-delivery';
            case 5: return 'icon icon-ok';
            case 6: return 'icon icon-error red';
            case 7: return 'icon icon-denial red';
            case 8: return 'icon icon-deliveryReturn red';
            case 9: return 'icon icon-moneyOK green';
            case 10: return 'icon icon-boxCanceled red';
        }
    }

    /** Wybranie wiersza i ewentualne przeskorolowanie się do niego */
    public selectRow(id: number, scroll: boolean = false, highlight = false) {
        if (this.GridComponent) {
            const forceSendEventAfterRefresh = (id === this.selectedRouteId);
            this.GridComponent.instance.selectRows([id], false).then(rowData => {
                let rowIdx = null;
                const getElem = highlight || scroll;
                if (getElem || forceSendEventAfterRefresh) {
                    rowIdx = this.GridComponent.instance.getRowIndexByKey(id);
                }
                if (getElem && (rowIdx || rowIdx === 0) && rowIdx !== -1) {
                    /** Działa poprawnie tylko jak wiersz jest załadowany. jeżeli nie jest to getRowIndexByKey zwraca -1 */
                    const rowElem = this.GridComponent.instance.getRowElement(rowIdx);
                    if (rowElem && (<any>rowElem).length !== 0) {
                        this.GridComponent.instance.getScrollable().scrollToElement((<any>rowElem)[0]);
                        if (highlight) {
                            this.toastService.highlight((<any>rowElem)[0]);
                        }
                    }
                }
                if (forceSendEventAfterRefresh || id !== this.selectedRouteId) {
                    this.SelectedRouteChanged.emit({
                        selectedRouteId: id,
                        selectedRouteRow: rowData
                    });
                }
            });
        }
    }

}
