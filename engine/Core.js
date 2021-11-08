import {LifeCycleError, falseAssertion} from './Errors.js';
import { createEv, EventEmitter, RabisEvCenter, internalEventCenter} from './Event.js';
import lit from './lit.js';
import {GameDeltaTick} from './EngineConfig.js';
import {getDisplaySize, getScale} from './WindowManager.js';

export const NULLFUNC = () => void undefined;

export const RAssert = (condition, msgWhenFalse) => {
    if (!condition) falseAssertion(msgWhenFalse);
}

export const loader = (function () {
    let loader = [];

    function apply(initFunc) {
        loader.push(initFunc);
    }

    function load() {
        loader.forEach(el => el());
    }

    return {apply, load}
})();

let LifeCycle = {
    init: [],
    running: [],
    beforePause: [],
    onResume: [],
    beforeExit: [],
}

/**
 * @param {keyof LifeCycle} cycleTag 
 * @param {(...args: any) => void} handler 
 */
export function register(cycleTag, handler) {
    LifeCycle[cycleTag].push(handler);
}

const GameStates = {
    unInit: 0,
    running: 1,
    paused: 2,
    exited: 3,
    error: 4,
}

function TickGenerator(loopFunc) {
    let tickHandlers = [],
    occupied = false,
    pauseFlag = false;
    
    function once() {
        if (occupied) return;
        occupied = true;
        tickHandlers.forEach(handler => handler());
        occupied = false;
    }

    function doTick() {
        if (pauseFlag) return;
        once();
        loopFunc(doTick);
    }

    function start() {
        LifeCycle.onResume.forEach(el => el());
        pauseFlag = false;
        doTick();
    }

    function stop() {
        LifeCycle.beforePause.forEach(el => el());
        pauseFlag = true;
    }

    function addTickHandler(...handlers) {
        tickHandlers.push(...handlers);
    }

    function rmTickHandler(handler) {
        tickHandlers = tickHandlers.filter(v => handler != v);
    }

    return {
        start, stop, addTickHandler, rmTickHandler
    }


}

function _timeOut(handler) {
    setTimeout(handler, GameDeltaTick);
}

const renderTickGen = TickGenerator(requestAnimationFrame);
const gameTickGen = TickGenerator(_timeOut)

const GameLifeCycle = (function(){

    let gameState = GameStates.unInit;

    function init() {
        if (gameState !== GameStates.unInit) LifeCycleError.err_init('Can not change state').throwThis();
        LifeCycle.init.forEach(el => el());
        gameState = GameStates.paused;
        running();
    }

    function running() {
        if (gameState !== GameStates.paused) LifeCycleError.err_runtime('Can not change state').throwThis();
        LifeCycle.running.forEach(el => el());
        gameTickGen.start();
        renderTickGen.start();
        gameState = GameStates.running;
    }

    function pause() {
        if (gameState !== GameStates.running) LifeCycleError.err_runtime('Can not change state').throwThis();
        gameTickGen.stop();
        renderTickGen.stop();
        gameState = GameStates.paused;
    }

    function exit() {
        LifeCycle.beforeExit.forEach(el => el());
        gameState = GameStates.exited;
    }

    function state(showString=false) {
        if (showString) {
            for (const key in GameStates) {
                const val = GameStates[key];
                if (val === gameState) return key;
            }
        }
        return gameState;
    }

    return {
        start: init,
        pause, exit, state,
        resume: running
    }

})();

export function eachGameTick(...handlers) {
    gameTickGen.addTickHandler(...handlers);
}

export function offEachGameTick(handler) {
    gameTickGen.rmTickHandler(handler);
}

export function eachRenderTick(...handlers) {
    renderTickGen.addTickHandler(...handlers);
}

export {gameTickGen, renderTickGen}

export function startGame() {
    loader.load();
    GameLifeCycle.start();
}

export const Game = {
    pause: GameLifeCycle.pause,
    exit: GameLifeCycle.exit,
    state: GameLifeCycle.state,
    resume: GameLifeCycle.resume
}

//eachGameTick(() => internalEventCenter.distributeAll());

//====================================================================

export class RabisComponent {
    /**
     * @type {RabisActor}
     */
    target = null;

    constructor(actor) {
        this.target = actor;
    }

    active() {
        if (!this.tick || typeof this.tick !== 'function') return;
        tickSolver.on('game', this.tick);
    }

    deactive() {
        tickSolver.off('game', this.tick);
    }
}

export class Vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    getVec(array) {
        if (array) return [this.x, this.y];
        return {x: this.x, y: this.y};
    }

    setVec(x, y) {
        this.x = x;
        this.y = y;
    }

    static composite(vec1, vec2) {
        const [x1, y1] = vec1.getVec(true);
        const [x2, y2] = vec2.getVec(true);
        return new Vector2D(x1+x2, y1+y2);
    }

    composite(vec) {
        return Vector2D.composite(this, vec);
    }

    static dotProduct(vec1, vec2) {
        const [x1, y1] = vec1.getVec(true);
        const [x2, y2] = vec2.getVec(true);
        return x1*x2 + y1*y2;
    }

    dotProduct(vec) {
        return Vector2D.dotProduct(this, vec);
    }

}

class MovementComponent extends RabisComponent { 
    offset = new Vector2D(0, 0);
    setOffset = vec2d => {
        this.offset = vec2d;
        this.target.setOffsetPos(vec2d.x, vec2d.y);
    }
    setOffsetX = ox => {
        let _c = new Vector2D(ox, 0);
        this.setOffset(_c);
    }
    setOffsetY = oy => {
        let _c = new Vector2D(0, oy);
        this.setOffset(_c);
    }
    addOffset = vec2d => {
        let o = this.offset = this.offset.composite(vec2d);
        this.target.setOffsetPos(o.x, o.y);
    }
    addOffsetX = dx => {
        let _c = new Vector2D(dx, 0);
        this.addOffset(_c);
    }
    addOffsetY = dy => {
        let _c = new Vector2D(0, dy);
        this.addOffset(_c);
    }
    getOffset = () => {
        return this.offset;
    }
}

class AnimationController {
    frames = [];
    _counter = 0;
    _f = 0;
    createFrame(src) {
        let img = document.createElement('img');
        img.src = src;
        this.frames.push(img);
    }
    getFrame(index) {
        if (index) this._counter = index;
        return this.frames[this._counter];
    }
    nextFrame() {
        this._counter<this.frames.length-1? this._counter++: this._counter=0;
        return this.frames[this._counter];
    }
    frame(index) {
        return index? this.getFrame(index): this.nextFrame();
    }
}

class AnimationComponent extends RabisComponent {
    _anim = null;
    _frame = null;
    _canplay = false;
    getAnimController() {
        return new AnimationController();
    }
    play(anim, index=0) {
        this._anim = anim;
        anim.frame(index);
        this._canplay = true;
    }
    playFrame(anim, index) {
        if (this.stepper() || typeof index === 'number') this.target._image = anim.frame(index);
    }
    pause() {
        this._canplay = false;
    }
    stepper = () => true;
    tick = () => {
        if (this._canplay && this.stepper()) {
            this._frame = this._anim.frame();
            this.target._image = this._frame;
        }
    }
}

class Align extends RabisComponent {
    __getTargetInfo() {
        return this.target.getSize();
    }

    /**
     * @param {'start'|'center'|'end'} horizontal 
     * @param {'start'|'center'|'end'} vertical 
     */
    align(horizontal, vertical, ox=0, oy=0) {
        const wSize = getDisplaySize();
        const [w, h] = this.__getTargetInfo();
        let _w = 0, _h = 0;
        switch (horizontal) {
            case 'start':
                _w = 0;
                break;
            case 'end':
                _w = wSize.width - w;
                break;
            default:
            case 'center':
                _w = (wSize.width - w)/2;
                break;
        }
        switch (vertical) {
            case 'start':
                _h = 0;
                break;
            case 'end':
                _h = wSize.height - h;
                break;
            default:
            case 'center':
                _h = (wSize.height - h)/2;
                break;
        }

        this.target.setOffsetPos(_w + ox, _h + oy);
    }
}

const _ActorComps = {
    movement: MovementComponent,
    animation: AnimationComponent,
    align: Align,
}

export function addComponent(tag, componentClass) {
    _ActorComps[tag] = componentClass;
}

//====================================================================

let RabisActors = {};

export class RabisActor {
    constructor(id) {
        RAssert(typeof id !== 'string' || id, '你应该为此组件指明一个id');
        this.id = id;
        RabisActors[id] = this;
    }
    _components = {};
    ox = 0;  //offset x
    oy = 0;  //offset y
    width = 0;
    height = 0;
    setSize(w, h) {
        this.width = w;
        this.height = h;
    }
    getSize() {
        return [this.width, this.height];
    }
    setOffsetPos(ox, oy) {
        this.ox = ox;
        this.oy = oy;
    }
    getOffsetPos() {
        return [this.ox, this.oy];
    }
    extend(rabisObj) {
        RAssert(rabisObj instanceof RabisActor, 'extend函数仅接受一个RabisActor对象作为参数');
        let _ox = 0, _oy = 0; 
        Object.defineProperties(this, {
            ox: {
                get() {
                    return rabisObj.ox + _ox;
                },
                set(v) {
                    _ox = v;
                }
            },
            oy: {
                get() {
                    return rabisObj.oy + _oy;
                },
                set(v) {
                    _oy = v;
                }
            }
        });
    }
    mount(...rabisObj) {
        for (let i = rabisObj.length - 1; i --;) {
            rabisObj[i].extend(this);
        }
    }
    /**
     * @type {<T extends keyof _ActorComps>(tag: T) => any}
     */
    getActorComponent(tag, id=`default-${tag}`) {
        let c = new _ActorComps[tag](this);
        return this._components[id] = c;
    }
    /**
     * @param {RabisComponent} actorComponent 
     */
    useComponent(actorComponent) {
        RAssert(actorComponent.active, '你必须保留Component中的active函数');
        //console.log(actorComponent.active.toString());
        actorComponent.active();
    }
    /**
     * @type {<T extends keyof _ActorComps>(tag: T, initializer: (v: RabisComponent) => RabisComponent) => any}
     */
    mountComponent(tag, initializer=v=>v, id) {
        let c = this.getActorComponent(tag, id);
        initializer(c);
        this.useComponent(c);
    }
    getComponent = id => {
        return this._components[id]? this._components[id]: this._components[`default-${id}`];
    }
}

/**
 * @returns {RabisActor}
 */
export function getActor(id) {
    return RabisActors[id];
}

const tickSolver = new EventEmitter();

eachGameTick(() => {
    tickSolver.emit('game');
});

eachRenderTick(() => {
    lit.clear();
    tickSolver.emit('render');
});

const _rabisSpiritRender = Symbol('RabisSpiritRender');

let _scale = {
    sx: 1,
    sy: 1
};
let _changeScale = false;

export class RabisSpirit extends RabisActor {
    constructor(id, img) {
        super(id);
        if (img) this._image = img;
        if (!_changeScale) {
            let scale = getScale();
            if (scale) {
                _scale.sx = scale[0];
                _scale.sy = scale[1];
            }
        }
    }
    _image = null;
    [_rabisSpiritRender] = () => {
        let renderConf = {
            type: 'img',
            x: this.ox,
            y: this.oy,
            width: this.width * _scale.sx,
            height: this.height * _scale.sy,
            img: this._image
        };
        const afterProcessedRenderConf = this.render && this.render(renderConf);
        lit.render(afterProcessedRenderConf || renderConf);
    }
    getRawSize() {
        let w = this._image.naturalWidth;
        let h = this._image.naturalHeight;
        return [w, h];
    }
    getScaledSize() {
        let w = (this.width || this._image.naturalWidth)*_scale.sx;
        let h = (this.height || this._image.naturalHeight)*_scale.sy;
        return [w, h];
    }
    getSize() {
        let w = this.width || this._image.naturalWidth;
        let h = this.height || this._image.naturalHeight;
        return [w, h];
    }
}

export function activateActor(rabisActor) {
    if (rabisActor.active) rabisActor.active();
    if (rabisActor.tick) tickSolver.on('game', rabisActor.tick);
    if (rabisActor[_rabisSpiritRender]) tickSolver.on('render', rabisActor[_rabisSpiritRender]);
    return rabisActor;
}

export function deactivateActor(rabisActor) {
    if (rabisActor.tick) tickSolver.off('game', rabisActor.tick);
    if (rabisActor[_rabisSpiritRender]) tickSolver.off('render', rabisActor[_rabisSpiritRender]);
}

function _createActor(componentClass, id, ...args) {
    return new componentClass(id, ...args);
}

export function createSpirit(id, ...args) {
    return _createActor(RabisSpirit, id, ...args);
}