﻿import "@surface/core/extensions";

import { traverseElement, parseTextNode } from '@surface/core/utils';
export abstract class CustomElement extends HTMLElement
{
    private _template: Nullable<HTMLTemplateElement>;
    protected $preventAttributeChangedCallback: boolean = false;

	public get template(): Nullable<HTMLTemplateElement>
    {
		return this._template;
	}

	public set template(value: Nullable<HTMLTemplateElement>)
    {
		this._template = value;
	}
    
    constructor()
    {
        super();
        this.applyTemplate();
    }

    private applyTemplate(): void
    {
        if (window["ShadyCSS"])
            ShadyCSS.styleElement(this);
            
        if (this._template)
        {
            let content = document.importNode(this._template.content, true);
            this.applyDateBind(content);
            this.attachShadow({ mode: "open" }).appendChild(content);
        }
    }

    private applyDateBind(content: Node): void
    {
        traverseElement
        (
            content,
            node =>
            {
                if (node.nodeType == Node.TEXT_NODE)
                    parseTextNode(node, this);
            }
        );
    }

    protected letAttribute(attributeName: string, value: string): void
    {
        this.$preventAttributeChangedCallback = true;
        super.setAttribute(attributeName, value);
    }
    /** Query shadow root use string selector and returns all elements */
    public attachAll<T extends HTMLElement>(selector: string, slotName?: string): Array<T>;
    /** Query shadow root using regex pattern and returns all elements */
    public attachAll<T extends HTMLElement>(selector: RegExp, slotName?: string): Array<T>;
    public attachAll<T extends HTMLElement>(selector: string|RegExp, slotName?: string): Array<T>
    {
        if (this.shadowRoot)
        {
            let slots = this.shadowRoot
                .querySelectorAll(slotName ? `slot[name="${slotName}"]` : "slot");

            if (slots.length > 0)
            {            
                return slots.toArray()
                    .map
                    (
                        (slot: HTMLSlotElement) => slot.assignedNodes()
                            .filter((x: HTMLElement) => x.nodeType != Node.TEXT_NODE)
                            .filter
                            (
                                (x: HTMLElement) => selector instanceof RegExp ?
                                    x.tagName.toLowerCase().match(selector) :
                                    x.tagName.toLowerCase() == selector
                            )
                    )
                    .flat() as Array<T>;
            }
            else if (selector instanceof RegExp)
                return this.shadowRoot.querySelectorAll("*").toArray().filter(x => x.tagName.toLowerCase().match(selector)) as Array<T>;
            else
                return this.shadowRoot.querySelectorAll(selector).toArray() as Array<T>;
        }
        else
            throw new Error("Element don't has shadowRoot");
    }
    /** Query shadow root use string selector and returns the first element */
    public attach<T extends HTMLElement>(selector: string, slotName?: string);
    /** Query shadow root using regex pattern and returns the first element */
    public attach<T extends HTMLElement>(selector: RegExp, slotName?: string);
    public attach<T extends HTMLElement>(selector: string|RegExp, slotName?: string)
    {
        return this.attachAll<T>(selector as any, slotName)[0];
    }

    /** Called when the element is created or upgraded */
    public connectedCallback(): void
    { }

    /** Called when the element is inserted into a document, including into a shadow tree */
    public disconnectedCallback(): void
    { }

    /**
     * Called when an attribute is changed, appended, removed, or replaced on the element.
     * Only called for observed attributes.
     */
    public attributeChangedCallback(attributeName: string, oldValue: string, newValue: string, namespace: string): void
    {
        if (this.$preventAttributeChangedCallback)
        {
            this.$preventAttributeChangedCallback = false;
            return;
        }

        if (attributeName in this.style)
            this.style[attributeName] = newValue;
        else
            this[attributeName] = newValue;
    }

    /** Called when the element is adopted into a new document */
    public adoptedCallback(oldDocument: Document, newDocument: Document): void
    { }
}