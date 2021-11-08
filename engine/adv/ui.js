import {getUIContainer, EventEmitter, Resource} from '../Rabis.js';

let ui = getUIContainer();

let states = {},
_counter = 0;

class State {
    constructor() {
        this.id = _counter++;
        states[_counter] = this;
    }

    remove() {
        delete states[this.id];
        states[this.id] = null;
    }

}

class IView extends HTMLElement{
    _watcher = new EventEmitter();

    constructor(str) {
        super();
        this.shadow = this.attachShadow({mode:'open'});
        if (str) this.load(str);
        this._initState();
    }

    /**
     * @param {string} str HTML Strings
     */
    load(str) {
        let d = this.style.display;
        this.style.display = 'none';
        this.shadow.innerHTML = str;
        this.style.display = d;
        this._watcher.thisArg = this.shadow;
        return this;
    }

    _watch(key, watcher) {
        this._watcher.on(key, watcher);
    }

    _unwatch(key, watcher) {
        this._watcher.off(key, watcher);
    }

    static __handleValue = (el, v) => {
        if (el.hasAttribute('value')) {
            el.value = v;
        } else {
            el.innerText = v;
        }
    }

    static __handleProperty = (el, propName, v='') => {
        el.setAttribute(propName, v);
    }

    static __handleListener = (el, eventTag, handler) => {
        el.addEventListener(eventTag, handler);
    }

    _initState = () => {
        let state = new State();
        let self = this;
        this._state = new Proxy(state, {
            set(t, prop, v) {
                if (!t[prop]) {
                    self._watch(prop, v => {
                        let elName = prop, propName, handler;
                        if (~prop.indexOf(':')) {
                            const [_el, _p, _h] = prop.split(':');
                            elName = _el;
                            propName = _p;
                            handler = _h;
                        }
                        let el = self.shadow.getElementById(elName);
                        if (!el) return;
                        if (handler) return IView.__handleListener(el, handler, v);
                        if (propName) return IView.__handleProperty(el, propName, v);
                        return IView.__handleValue(el, v);
                    });
                }
                t[prop] = v;
                self._watcher.emit(prop, v);
                return true;
            },

            get(t, p) {
                return t[p];
            },

        });
    }

    _setStateByFunc(func) {
        func(this._state);
    }

    _setStateByData = obj => {
        const keys = Object.keys(obj);
        keys.forEach(k => this._state[k] = obj[k]);
    }

    setState(data) {
        requestAnimationFrame(() => {
            if (typeof data === 'function') return this._setStateByFunc(data);
            this._setStateByData(data);
        })
    }
}

customElements.define('adv-ui', IView);

function createViewClass(className, string) {
    className = class extends IView {
        name = className;
        constructor() {
            super(string);
        }
    }
    return className;
}

function defElement(tag, viewClass) {
    customElements.define(tag, viewClass);
}

const defaultUsrView = Resource.createBundle();
const viewLoader = {
    set(path) {
        const pathList = ~path.indexOf('\\')? path.split('\\'): path.split('/');
        const className = pathList.length && pathList[pathList.length-1];
        defaultUsrView.set(className, 'text', path);
        return className;
    },
    async get(name) {
        return await defaultUsrView.get('default-ui' + name);
    }
}

async function loadView(pathArr, namespace='usr') {
    const loader = viewLoader;
    let names = [];
    for (let i = 0; i < pathArr.length; i++) {
        names.push(loader.set(pathArr[i]));
    }
    let returns = {};
    for (let i = 0; i < names.length; i++) {
        let name = names[i];
        const viewClass = createViewClass(name, await loader.get(name));
        defElement(namespace+'-'+name, viewClass);
        returns[name] = viewClass;
    }
    return returns;
}

function mountView(view) {
    if (view instanceof IView) ui.appendChild(view);
}

function getResBundle() {
    return defaultUsrView;
}

function createView(string, viewClass=IView) {
    return new viewClass(string);
}

export const UI = {
    mountView, IView, loadView, getResBundle, defElement, createView
}