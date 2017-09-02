import {Component} from '@angular/core';
import {MdButtonToggleChange} from '@angular/material';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})

export class AppComponent {
    title = 'app';
    ip: string = '192.333.0.0';
    ip1: string = '255.255.0.0';
    ip2: string = '192.168.0.1';
    disabledBlocks: boolean[] = [];


    onDisableBlockChange($event: MdButtonToggleChange) {
        // we must change the whole array for this to kick CD.
        this.disabledBlocks = this.disabledBlocks.slice();
        this.disabledBlocks[parseInt($event.value)] = $event.source.checked;
    }
}
