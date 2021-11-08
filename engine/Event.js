import {eachGameTick, Game, offEachGameTick} from './Core.js';

export class EventEmitter {

    events = {};
    thisArg = Function.prototype;
    maxLength = -1;

    /**
     * 
     * @param {number} size 
     */
    setMaxListeners(size) {
        this.maxLength = size;
    }

    /**
     * 
     * @param {string} type 
     * @param {(...args) => void} handler 
     */
    on(type, handler) {
        if (!handler || typeof handler !== 'function') return;
        if (this.events[type]) {
            const arr = this.events[type], len = this.maxLength;
            if (~len && arr.length === this.maxLength) {
                return;
            }
            arr.push(handler);
        } else {
            this.events[type] = [handler];
        }
    }

    /**
     * 
     * @param {string} type 
     * @param {(...args) => void | undefined} handler 
     * @returns 
     */
    off(type, handler) {
        if (!handler) return this.offAll();
        let arr = this.events[type], count = 0;
        if(arr) {
            const len = arr.length;
            let result = [];

            for (let i = 0; i < len; i++) {
                if (el === handler || el.toString() === handler.toString()) {
                    count++;
                    continue;
                }
                result.push(arr[i]);
            }

            delete this.events[type];
            this.events[type] = result;

            return count;
        }
    }

    /**
     * 
     * @returns {number}
     */
    offAll() {
        const size = this.events[type].length;
        delete this.events[type];
        this.events[type] = null;
        return size;
    }

    /**
     * 
     * @param {string} type 
     * @param  {...any} args 
     */
    emit(type, ...args) {
        let arr = this.events[type];
        if (arr) {
            const len = arr.length;
            for (let i = 0; i < len; i++) {
                arr[i].apply(this.thisArg, args);
            }
        }
    }

    /**
     * 
     * @param {string} type 
     * @param  {...any} args 
     */
    once(type, ...args) {
        this.emit(type, ...args);
        this.offAll();
    }

    /**
     * 
     * @param {string} type 
     * @returns {Array<any>}
     */
    listeners(type) {
        return this.events[type];
    }

    constructor() {

        /**
         * alias
         */
        this.addEventListener = this.on;
        this.removeListener = this.off;
        this.removeAllListener = this.offAll;

    }

}

const keyDownEvent = new EventEmitter(),
keyUpEvent = new EventEmitter();

function activeKeyDownEvent() {
    window.addEventListener('keydown', function(ev) {
        if (Game.state() === 1) ev.preventDefault();
        keyDownEvent.emit(ev.key, {
            ctrl: ev.ctrlKey,
            shift: ev.shiftKey,
            alt: ev.altKey,
            meta: ev.metaKey
        });
    });
}

function activeKeyUpEvent() {
    window.addEventListener('keyup', function(ev) {
        if (Game.state() === 1) ev.preventDefault();
        keyUpEvent.emit(ev.key, {
            ctrl: ev.ctrlKey,
            shift: ev.shiftKey,
            alt: ev.altKey,
            meta: ev.metaKey
        });
    });
}

function initKeyEvent() {
    activeKeyDownEvent();
    activeKeyUpEvent();
}

initKeyEvent();

export function bindKeyDown(key, handler) {
    keyDownEvent.on(key, handler);
}

export function bindKeyUp(key, handler) {
    keyUpEvent.on(key, handler);
}


export class RabisEvCenter {
    channels = {};
    createChannel(name) {
        if (this.channels[name]) return false;
        return this.channels[name] = [];
    }
    removeChannel(name) {
        if (!this.channels[name]) return false;
        this.channels[name] = null;
        return true;
    }
    getChannel(name) {
        return this.channels[name] || null;
    }
    addSub(channelName, distributeListener) {
        let channel = this.getChannel(channelName) || this.createChannel(channelName);
        if (channel.subs){
            channel.subs.add(distributeListener);
        } else {
            channel.subs = new Set();
            channel.subs.add(distributeListener);
        }
    }
    rmSub(channelName, distributeListener) {
        return this.channels[channelName].subs.delete(distributeListener);
    }
    predistribute(channelName, data) {
        let channel = this.getChannel(channelName) || this.createChannel(channelName);
        return channel.push(data);
    }
    distribute(channelName) {
        let channel = this.getChannel(channelName);
        if (!channel) return;
        let subs = channel.subs;
        if (!subs) return;
        subs.forEach(func => {
            channel.forEach(data => func(data));
        })
        channel.length = 0;
    }
    distributeAll() {
        let keys = Object.keys(this.channels);
        keys.forEach(name => this.distribute(name));
    }
}

export class RabisEvPub {
    publish(center, channelName, data) {
        center.predistribute(channelName, data);
    }
}

export class RabisEvSub {
    subscribe(center, channelName, distributeListener) {
        center.addSub(channelName, distributeListener);
    }
    unsubscribe(center, channelName, distributeListener) {
        center.rmSub(channelName, distributeListener);
    }
}

export let internalEventCenter = new RabisEvCenter();
let internalEvStorage = {};

/**
 * @param {string} activeTag 
 * @param {string} key 
 * @param {()=>any} data 
 */
export function createEv(activeTag, data) {
    let pub = new RabisEvPub(),
    sub = new RabisEvSub(),
    c = internalEventCenter,
    gen = data;

    function _pub(data) {
        if (data === null || data === undefined) pub.publish(c, activeTag, gen());
        else pub.publish(c, activeTag, data);
    }

    function _sub(listener) {
        sub.subscribe(c, activeTag, listener);
    }

    function _unsub(listener) {
        sub.unsubscribe(c, activeTag, listener);
        offEachGameTick(distribute);
    }

    function distribute() {
        c.distribute(activeTag);
    }

    eachGameTick(distribute);

    const _ev = {
        subscribe: _sub,
        unsubscribe: _unsub,
        publish: _pub,
    }

    internalEvStorage[activeTag] = _ev;

    return _ev;
}

export function createEvent(eventTag) {
    let ev = internalEvStorage[eventTag] = new EventEmitter();
    return {
        emit() {
            ev.emit(eventTag);
        },
        on(handler) {
            ev.on(eventTag, handler);
        },
        off(handler) {
            ev.off(eventTag, handler);
        }
    }
}
export function subEvent(eventTag, handler) {
    internalEvStorage[eventTag].on(eventTag, handler);
}
export function offEvent(eventTag, handler) {
    internalEvStorage[eventTag].off(eventTag, handler);
}
export function triggerEvent(eventTag, ...args) {
    internalEvStorage[eventTag].emit(eventTag, ...args);
}

function getEv(activeTag) {
    return internalEvStorage[activeTag];
}

export function getEvSub(activeTag) {
    let ev = getEv(activeTag);
    return {
        subscribe: ev.subscribe,
        unsubscribe: ev.unsubscribe
    }
}

const _keyOccupied = new Set();

export function createKeyEv(activeTag, key, data) {
    let ev = createEvent(activeTag, data);
    bindKeyUp(key, () => {
        _keyOccupied.delete(key);
        ev.emit(data);
    });
}

export function createAxisEv(activeTag, key, data, doLoop=true) {
    let ev = createEvent(activeTag, data);
    if (doLoop) {
        eachGameTick(() => {
            if (_keyOccupied.has(key)) {
                ev.emit(key, data);
            }
        })
        bindKeyDown(key, () => _keyOccupied.add(key));
        bindKeyUp(key, () => _keyOccupied.delete(key));
        return;
    }
    bindKeyDown(key, () => {
        ev.emit(key, {type: 0, data});
    });
    bindKeyUp(key, () => {
        ev.emit(key, {type: 1, data});
    });
}

export function subKeyEv(activeTag, handler) {
    getEv(activeTag).on(activeTag, handler);
}