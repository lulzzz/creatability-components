// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
    accentColor,
    backgroundColor,
    buttonLabelColor,
    labelColor,
    buttonBackgroundColor,
    titleFontFamily,
    outlineBorderColor
} from './styles';
import { html, LitElement } from '@polymer/lit-element';
import { property } from './decorators';
import { setBooleanAttribute } from '../utils';
import './icon'


interface PanelProperties {
    label: string;
    disableSkipToContent: boolean;
    closed: boolean;
}

type queryPattern = (v:string)=> string;

const queries:  queryPattern[] = [
    (v)=> v,
    (v)=> `acc-${v}`,
    (v)=> `[name="${v}" i]`,
    (v)=> `[label="${v}" i]`,
    (v)=> `[value="${v}" i]`,
    (v)=> `.${v}`,
    (v)=> `#${v}`
];


const extractValue = (el:any):any => {
    if(el.value) {
        if(typeof el.value === 'string') {
            if(el.value.toLowerCase() === 'true') {
                return true;
            } else if(el.value.toLowerCase() === 'false') {
                return false;
            } else if(isFinite(parseInt(el.value, 10))) {
                return parseInt(el.value, 10);
            }
        }
        return el.value;
    }
    if(el.selected) {
        if(el.selected.value){
            return el.selected.value;
        }
        return el.selected;
    }
    return null;
}

/**
 * <acc-side-panel label="App Name">
 * The side panel element that houses UI elements.
 */
export class SidePanel extends LitElement {

    /**
     * the label and header for the side panel
     */
    @property({ type: String })
    public label:string = '';

    /**
     * skip to content shows up in the tab order of the side panel
     * and emits the 'skiptocontent' event. Setting this to true, hides it
     */
    @property({ type: Boolean })
    public disableSkipToContent: boolean = false;

    /**
     * is the side panel in its collapsed state
     */
    @property({ type: Boolean })
    public closed: boolean = false;


    getValue(name:string) {
        const el = this.query(name);
        if(!el){
            return null;
        }
        return extractValue(el);
    }

    query(name:string, eventType?: string, eventHandler?: EventHandlerNonNull):HTMLElement|null {
        const _query = () => {
            let i:number = 0;
            while(i < queries.length) {
                const el = this.querySelector(queries[i](name));
                if(el !== null){
                    return el as HTMLElement;
                }
                i++;
            }
            const find = (baseElement: Element, query: string): Element => {
                const asAny = (baseElement as any);
                if(asAny.value && asAny.value.toLowerCase && asAny.value.toLowerCase() === query.toLowerCase()) {
                    return baseElement;
                } else if(asAny.label && asAny.label.toLowerCase && asAny.label.toLowerCase() === query.toLowerCase()) {
                    return baseElement;
                }
                let found = null;
                for(let child of baseElement.children) {
                    found = find(child, query);
                    if(found) {
                        return found;
                    }
                }
            }
            return find(this, name) as HTMLElement;
        };

        const element = _query();

        if(element && typeof eventType === 'string' && typeof eventHandler === 'function') {
            element.addEventListener(eventType, eventHandler);
        }
        return element;
    }

    focus(){
        //when focused, move focus to the main header
        super.focus();
        const h1 = this.shadowRoot.querySelector('h1') as HTMLElement;
        if (h1) {
            h1.focus();
        }
    }

    _didRender(props: any, changed: any, prev: any) {
        if(changed && changed.hasOwnProperty('closed')) {
            //if it was just closed focus the open button
            //if it was just opened focus the close button
            const button = this.shadowRoot.querySelector( props.closed ? '.open-button' : '.close-button') as HTMLElement;
            if(button) {
                button.focus();
            }
        }
        return super._didRender(props, changed, prev);
    }

    _propertiesChanged(props: PanelProperties, changed: any, prev: any) {
        if(!changed || !prev) {
            return;
        }
        setBooleanAttribute(this, 'closed', props.closed);
        if(props.closed !== prev.closed) {
            setTimeout(() => {
                this.dispatchEvent(new CustomEvent(props.closed ? 'close' : 'open', { bubbles: true }));
                this.dispatchEvent(new CustomEvent('resize', { bubbles:true }));
            }, 0);
        }
        super._propertiesChanged(props, changed, prev);
    }

    _render({ label, disableSkipToContent }:PanelProperties){
        return html`
            <style>
                :host {
                    position: absolute;
                    top: 0;
                    left: 0;
                    color: ${buttonLabelColor};
                    z-index: 2;
                }

                .container {
                    height: calc(100vh - 95px);
                    width: 300px;
                    min-height: 100%;
                    background-color: ${backgroundColor};
                    overflow: auto;
                    border-right: 1px solid ${outlineBorderColor};
                }

                :host([closed]) .container {
                    display: none;
                }

                :host([closed]) .open-button {
                    display: inline-block;
                }

                :host([closed]) .container {
                    display: none;
                }

                :host::before {
                    padding-bottom: 110px;
                    position: relative;
                    display: block;
                    content: '';
                }

                #side-panel-nav {
                    padding-top: 24px;
                }


                header {
                    background: ${backgroundColor};
                    border-bottom: 1px solid ${outlineBorderColor};
                    border-right: 1px solid ${outlineBorderColor};
                    color: ${labelColor};
                    padding: 40px 24px 40px;
                    position: fixed;
                    top: 0;
                    width: 252px;
                    z-index: 2;
                }

                h1 {
                    font-family: ${titleFontFamily};
                    font-size: 26px;
                    font-weight: 700;
                    margin: 0;
                    padding: 0;
                }

                .close-button {
                    right: 30px;
                    width: 48px;
                    height: 48px;
                    position: absolute;
                    top: 50%;
                    border: none;
                    background: transparent;
                    transform: translateY(-50%);
                    display: flex;
                    justify-content: center;
                    flex-direction: column;
                    align-items: center;
                }

                .skip-to-content {
                    height: 1px;
                    clip: rect(1px, 1px, 1px, 1px);
                    color: ${accentColor};
                    font-weight: bold;
                    overflow: hidden;
                    opacity: 0;
                    width: 1px;
                    position: absolute;
                    top: 0;
                    left: -100px;
                    background-color: var(--background-color);
                    border: 1px solid ${outlineBorderColor};
                }

                .skip-to-content:focus, .skip-to-content.debug {
                    clip: auto;
                    height: 35px;
                    opacity: 1;
                    width: 50%;
                    z-index: 20;
                    position: absolute;
                    top: 100px;
                    left: 25%;
                    background-image: none;
                    background-color: ${buttonBackgroundColor};
                }

                .open-button {
                    --margin: 16px;
                    --button-width: 60px;
                    --button-height: 40px;
                    display: none;
                    position: absolute;
                    top: var(--margin);
                    left: var(--margin);
                    width: var(--button-width);
                    height: var(--button-height);
                    background-color: ${buttonBackgroundColor};
                    border: 1px solid ${outlineBorderColor};
                    box-sizing: border-box;
                }

                .open-button svg {
                    position: relative;
                    top: 4px;
                    width: 28px;
                }

                acc-button {
                    cursor: pointer;
                }

            </style>
            <button
                class="open-button"
                aria-label="Open Menu"
                on-click=${()=> this.closed = false}>
                <acc-icon icon="menu"></acc-icon>
                </button>
            <section class="container" role="menubar" aria-label="left side panel">
                <header>
                    <h1 tabindex="-1">${label}</h1>
                    <button
                        class="close-button"
                        on-click=${() => !(this.closed = true)}
                        aria-label="Collapse menu">
                        <acc-icon icon="close"></acc-icon>
                    </button>
                    <button
                        tabindex="0"
                        aria-label="Skip to content"
                        class="skip-to-content"
                        style="width: 50%;"
                        on-click=${()=> !disableSkipToContent && this.skipToContent()}>Skip to Content</button>
                </header>
                <nav id="side-panel-nav">
                    <slot></slot>
                </nav>
            </section>
        `;
    }


    public skipToContent() {
        this.dispatchEvent(new CustomEvent('skiptocontent', { bubbles: true }))
    }
}


customElements.define('acc-side-panel', SidePanel);