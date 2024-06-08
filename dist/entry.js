class Entry extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
      <style>
        textarea {
            font-size: 120%;
        }
    height: 150px;
      </style>
      <div>
        <h3></h3>
        <textarea cols="75" rows="3"></textarea>
      </div>
    `;
        this.labelElement = this.shadowRoot.querySelector('h3');
        this.textareaElement = this.shadowRoot.querySelector('textarea');
    }

    connectedCallback() {
        if (this.hasAttribute('label')) {
            this.labelElement.textContent = this.getAttribute('label');
        }
        if (this.hasAttribute('id')) {
            this.textareaElement.id = this.getAttribute('id');
        }
        if (this.hasAttribute('name')) {
            this.textareaElement.name = this.getAttribute('name');
        }
        if (this.hasAttribute('value')) {
            this.textareaElement.value = this.getAttribute('value');
        }
        this.textareaElement.addEventListener('focusout', () => {
            this.setAttribute('value', this.textareaElement.value);
        });
    }

    static get observedAttributes() {
        return ['value'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && oldValue !== newValue) {
            this.textareaElement.value = newValue;
        }
        console.warn("Attribute changed: ", name, oldValue, newValue, this.textareaElement.value)
    }
}

customElements.define('entry-field', Entry);
