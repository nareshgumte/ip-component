import {
    Component, Input, ViewEncapsulation, forwardRef, Output, EventEmitter, ViewChildren,
    QueryList, ElementRef, Renderer, ChangeDetectionStrategy, ChangeDetectorRef,
    trigger, transition, style, animate, state
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';

import {noop, v4, v6, inputSelection} from './utils';

export type IPV_MODE_TYPE = 'ipv4' | 'ipv6';
export type IP_VALIDATION_TYPE = 'none' | 'char' | 'block';

// if supported set it, else try once

function isV6(mode: IPV_MODE_TYPE) {
    return mode === 'ipv6';
}

export const ANGULAR2_IP_CONTROL_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ShIpAddressComponent),
    multi: true
};

function cancelEvent($event: Event): void {
    $event.preventDefault();
    $event.stopPropagation();
}

@Component({
    selector: 'sh-ip-address',
    templateUrl: './sh-ip-address.component.html',
    styleUrls: [
        './sh-ip-address.component.css'
    ],
    providers: [ANGULAR2_IP_CONTROL_VALUE_ACCESSOR],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShIpAddressComponent implements ControlValueAccessor {
    public blocks: string[] = v4.blocks();
    public blocksRef: number[] = this.blocks.map((v, i) => i);
    public invalidBlocks: string[] = [];
    public containerClass: string[] = [];
    public vX: typeof v6 | typeof v4 = v4;
    public inputAnim: string;

    get focused(): boolean {
        return this.containerClass.indexOf('sh-ip-address-focused') > -1;
    }

    set focused(value: boolean) {
        const idx = this.containerClass.indexOf('sh-ip-address-focused');
        if (value && idx === -1) {
            this.containerClass.push('sh-ip-address-focused');
        } else if (!value && idx > -1) {
            this.containerClass.splice(idx, 1);
        }
    }

    get mode(): IPV_MODE_TYPE {
        return this._mode;
    }

    /**
     * IP format.
     * Valid values: "ipv4" or "ipv6"
     * @param mode
     */
    @Input() set mode(mode: IPV_MODE_TYPE) {
        if (this._mode === mode) return;

        this.vX = isV6(mode) ? v6 : v4;

        this._mode = mode;
        this.blocks = this.vX.blocks();
        this.blocksRef = this.blocks.map((v, i) => i);
    }

    get type(): string {
        return this._type;
    }

    /**
     * Setting type
     * @param type
     */
    @Input() set type(type: string) {

        this._type = type;

    }


    get value(): string {return this._value;};

    @Input() set value(v: string) {
        if (v !== this._value) {
            this._value = v;
            this.blocks = this.toBlocks(v);
            this._onChangeCallback(v);

            if (!v) {
                for (let i = 0; i < this.blocks.length; i++) {
                    this.invalidBlocks[i] = undefined;
                }
            } else {
                for (let i = 0; i < this.blocks.length; i++) {
                    this.markBlockValidity(this.blocks[i], i);
                }
            }

            this._cdr.markForCheck();
            this._cdr.detectChanges();
        }
    }

    get highlightInvalidBlocks(): boolean {
        return this._highlightInvalidBlocks;
    }

    /**
     * When true add's the 'sh-ip-address-error' class to the block when it's invalid.
     * @param value
     */
    @Input() set highlightInvalidBlocks(value: boolean) {
        if (this._highlightInvalidBlocks === value) return;

        this._highlightInvalidBlocks = value;
        for (let i = 0; i < this.blocks.length; i++) {
            this.markBlockValidity(this.blocks[i], i);
        }
    }

    /**
     * The validation level performed on an input.
     * This is a validation performed based on a keystroke. Does not apply to paste.
     * none - No validation
     * char - Only valid char's are allowed (however, invalid value can be set. e.g: 333)
     * block - Only valid char's that compose a valid block are allowed
     *
     * Default: 'block'
     * @type {string}
     */
    @Input() inputValidation: IP_VALIDATION_TYPE = 'block';


    /**
     * A bit map representing disabled blocks.
     * e.g: [1, 1, 0, 0] will set disabled the first 2 blocks (from the left).
     * Since the component is set to OnPush this is an immutable array, to change the state
     * replace the array (don't change it's items).
     * @type {Array}
     */
    @Input() disabledBlocks: boolean[] = [];
    


    @Output() change = new EventEmitter<string>();

    @ViewChildren('input') public inputs: QueryList<ElementRef>;

    private _mode: IPV_MODE_TYPE = 'ipv4';
    private _type: string = 'manual';
    private _value: string = null;
    private _onTouchedCallback: () => void = noop;
    private _onChangeCallback: (_: any) => void = noop;
    private _highlightInvalidBlocks: boolean = true;

    constructor(private _renderer: Renderer, private _cdr: ChangeDetectorRef) {
        this.containerClass.push('sh-ip-address-theme-material');
    }

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this._onChangeCallback = fn;
    }

    registerOnTouched(fn: any): void {
        this._onTouchedCallback = fn;
    }

    onChange(value: string, idx: number): void {
        if (this.blocks[idx] === value) return;
        this.blocks[idx] = value;
        this.notifyChange(this.fromBlocks(this.blocks));
        this.markBlockValidity(value, idx);
    }

    onKeyPress($event: KeyboardEvent, idx: number): void {
        // safari/ff will cancel copy/paste , chrome wont... so don't mess with it.
        if ($event.metaKey || $event.ctrlKey || $event.altKey) return;

        // browser support (e.g: safari)
        let key = typeof $event.key === 'string' ? $event.key : String.fromCharCode($event.charCode);
        if (key === this.vX.SEP) {
            cancelEvent($event);
            this.focusNext(idx);
        }

        const value = inputSelection.insert($event.target as any, key);
        if (this.inputValidation === 'block' && !this.vX.RE_BLOCK.test(value)) {
            return cancelEvent($event);
        } else {
            if (value.length == 3) {
                this.focusNext(idx);
            }
        }
        this.markBlockValidity(value, idx);
    }

    onKeyUp($event: KeyboardEvent, idx: number): void {
        if (typeof $event.keyCode === 'number') {
            if ($event.keyCode !== 8) return;
        } else if ($event.key !== 'Backspace') return;


        const input: HTMLInputElement = $event.target as any;
        const value = input && input.selectionStart >= 0 && input.selectionEnd > input.selectionStart
            ? input.value.substr(0, input.selectionStart) + input.value.substr(input.selectionEnd)
            : input.value.substr(0, input.value.length - 1)
            ;

        this.markBlockValidity(value, idx);
    }

    onBlur(idx: number): void {
        this.focused = false;
    }

    onFocus(idx: number): void {
        this.focused = true;
    }

    private focusNext(idx: number, selectRange: boolean = true): void {
        const next = this.inputs.toArray()[idx + 1];
        if (next) {
            this._renderer.invokeElementMethod(next.nativeElement, 'focus');

            if (selectRange && this.blocks[idx + 1]) {
                this._renderer.invokeElementMethod(
                    next.nativeElement,
                    'setSelectionRange',
                    [0, this.blocks[idx + 1].toString().length]
                );
            }
        }
    }

    private markBlockValidity(value: string, idx: number): void {
        this.invalidBlocks[idx] = !this.highlightInvalidBlocks || this.vX.RE_BLOCK.test(value) ? undefined : 'sh-ip-address-error';
    }
    private notifyChange(value: string): void {
        this._onChangeCallback(value);
        this.change.emit(value);
    }

    private toBlocks(value: string): string[] {
        return this.vX.split(value);
    }

    private fromBlocks(blocks: string[]): string {
        return this.vX.fromBlocks(blocks);
    }
}
