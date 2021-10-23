import {EventEmitter} from './Event.js';
import {falseAssertion} from './Errors.js';

const assert = (condition, msg) => {
    if (!condition) falseAssertion(msg);
}

const FileBase = {
    add(name, bundle) {
        if (name == 'add') return;
        this[name] = bundle;
    },
    remove(name) {
        delete this[name];
        this[name] = null;
    }
};

export const ResourceBundleStates = {
    Unload: 0,
    Loading: 1,
    Loaded: 2
}

class ResourceBundle { 
    _loader = new EventEmitter();
    _coreEmitter = new EventEmitter();
    _data = {};
    counter = 0;
    size = 0;
    state = 0;
    used = false;
    constructor() {
        this.on('loaded', () => {
            this.state = 2;
        });
        this.on('counterChange', () => {
            if (this.size == this.counter) {
                this._coreEmitter.emit('loaded', this._data);
            }
        });
        this.on('loading', () => {
            this.used = true;
        });
    }
    __getNativeTypeObj(type, src) {
        let _s = document.createElement(type);
        _s.src = src;
        return _s;
    }
    async __getCustomTypeObj(type, src) {
        let res = await fetch(src);
        if (type == 'binary') type = 'arrayBuffer';
        return await res[type]();
    }
    __counterChange = (source, tag) => {
        this.counter ++;
        this._data[tag] = source;
        this._coreEmitter.emit('counterChange', {size: this.size, counter: this.counter, state: this.state});
    }
    /**
     * @param {string} tag 
     * @param {'img'|'audio'|'video'|'text'|'json'|'binary'|'bundle'} type 
     * @param {string|ResourceBundle} src 
     */
    set(tag, type, src) {
        if (this.used) throw TypeError();
        this._loader.on(tag, () => {
            this._coreEmitter.emit('sizeChange');
            this.size ++;
            let _s = null;
            if (type === 'audio' || type === 'img' || type === 'video') {
                _s = this.__getNativeTypeObj(type, src);
                _s.onload = () => {
                    this.__counterChange(_s, tag);
                }
                return this;
            }
            if (type === 'text' || type === 'json' || type === 'binary') {
                _s = this.__getCustomTypeObj(type, src);
                _s.then(s => {
                    this.__counterChange(s, tag);
                });
                return this;
            }
            if (type === 'bundle') {
                src.on('loaded', () => {
                    this.__counterChange(src, tag);
                });
                src.loadAll();
                return this;
            }
        });
        return this;
    }
    load(tag) {
        if (!this.state) this._coreEmitter.emit('loading');
        this.state = ResourceBundleStates.Loading;
        this._loader.emit(tag);
    }
    loadAll() {
        let keys = Object.keys(this._loader.events);
        keys.forEach(k => this.load(k));
    }
    getLoaded(tag) {
        return this._data[tag];
    }
    getAsync(tag) {
        return new Promise(_res => {
            if (this.state == 2) return _res(this.getLoaded(tag));
            this.on('loaded', () => {
                _res(this.getLoaded(tag));
            });
            if (this.state == 0) this.loadAll();
        })
    }
    async get(tag) {
        if (this.state === 2) return this.getLoaded(tag);
        return await this.getAsync(tag);
    }
    /**
     * @param {'loading'|'loaded'|'sizeChange'|'counterChange'} type 
     * @param {() => void} func 
     */
    on(type, func) {
        this._coreEmitter.on(type, func);
    }
}

function createResourceBundle(bundleId) {
    let _rb = new ResourceBundle();
    if (bundleId) FileBase.add(bundleId, _rb);
    return _rb;
}

async function getResource(path) {
    const pathList = path.split('/'),
    bundleId = pathList.splice(0, 1)[0],
    file = pathList.splice(0, 1)[0];

    let bundle = FileBase[bundleId];
    const data = await bundle.get(file);

    if (pathList.length < 1) return data;

    return await getBundleResource(data, pathList);
}

async function getBundleResource(data, pathList) {
    if (!(data instanceof ResourceBundle)) throw TypeError('');
    if (pathList.length === 1) return await data.get(pathList[0]);

    const path = pathList.splice(0, 1)[0],
    bundle = await data.get(path);

    return await getBundleResource(bundle, pathList);
}

export const Resource = {
    createBundle: createResourceBundle,
    get: getResource,
}