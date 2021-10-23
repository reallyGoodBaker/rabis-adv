import * as R from '../engine/Rabis.js';
import {activateActor, renderTickGen, Vector2D, eachGameTick, offEachGameTick} from '../engine/Core.js';
import lit from '../engine/lit.js';
import {GameDeltaTick} from '../engine/EngineConfig.js';

/**
 * @type
 */
export class ADVAgent extends R.Spirit {
    _show = true;
    constructor(agentID, image) {
        super(agentID, image);
        this.actor = this;
        this.render = renderConf => {
            if (this._show) return renderConf;
            return {type: 'blank'}
        }
    }

    hide()  {
        this._show = false;
    }

    show() {
        this._show = true;
    }

    size() {
        return {
            width: this.actor._image.naturalWidth,
            height: this.actor._image.naturalHeight
        }
    }
}

/**
 * @typedef {{id: string; source: any; run: (actor: ADVAgent) => void}} AgentConfig
 */

/**
 * @param {AgentConfig} config 
 * @returns 
 */
export function createCustomAgent(config) {
    const {id, source, run} = config;
    let _avg = new ADVAgent(id, source);
    run(_avg);
    activateActor(_avg);
    _avg.hide();
    return _avg;
}

R.addComponent('avg-interpolator', class extends R.Component {

    _source = 0;
    _target = 0;
    _eachTickHandlers = [];
    _funcPtr = null;

    _handle = (...args) => {
        this._eachTickHandlers.forEach(h => h(...args));
    }

    step = v => v+1;
    compare = (v, t, s) => true;

    init(source, target, step) {
        this._source = source;
        this._target = target;
        step && (this.step = step);
    }

    register(handler) {
        this._eachTickHandlers.push(handler);
    }

    start = () => {
        let s = this._source,
        t = this._target,
        v = s,
        step = this.step,
        compare = this.compare;

        eachGameTick(this._funcPtr = () => {
            this._handle(v, t, s);
            if (compare(v, t, s)) return v = step(v);
            this.skip();
        });
    }

    skip() {
        offEachGameTick(this._funcPtr);
        requestAnimationFrame(() => {
            this._handle(this._target, this._target, this._source);
        });
        this._eachTickHandlers = [];
    }

    pos(ms, x, y) {
        let __rawOffset = this.target.getOffsetPos();
        let [rx, ry] = __rawOffset;
        x = x? +x: rx;
        y = y? +y: ry;
        let count = Math.floor(ms/GameDeltaTick);
        let dx = (x-rx)/count, dy = (y-ry)/count;

        this.init(__rawOffset, [x, y]);
        this.step = v => [v[0]+dx, v[1]+dy];
        this.compare = (v, t) => {
            return Math.abs(v[0] - t[0]) > Math.abs(dx);
        }
        this.register(v => {
            this.target.setOffsetPos(...v);
        });
        this.start();
    }

    alpha(ms, startAlpha, endAlpha) {

    }

});