import {Component} from '@angular/core';
import {MdButtonToggleChange} from '@angular/material';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent {
    sip: string = '192.333.0.0';
    sip1: string = '255.255.0.0';
    sip2: string = '192.168.0.1';
    stype: string = 'manual';

    aip: string = '202.123.1.1';
    aip1: string = '255.255.0.0';
    aip2: string = '255.0.0.0';
    atype: string = 'auto';


    disabledBlocks: boolean[] = [];



    onDisableBlockChange($event: MdButtonToggleChange) {
        // we must change the whole array for this to kick CD.
        this.disabledBlocks = this.disabledBlocks.slice();
        this.disabledBlocks[parseInt($event.value)] = $event.source.checked;
    }
}
