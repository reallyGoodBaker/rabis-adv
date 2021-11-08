import Lit from './lit.js';
import {ErrorBuilder, hideStack} from './Errors.js';
import {Global} from './Rabis.js';
import {EventEmitter} from './Event.js'

const _intervalEmitter = new EventEmitter();

function initLitRenderer(h, w, canvas, sx, sy) {
    Lit.options.HEIGHT = h*sy;
    Lit.options.WIDTH = w*sx;
    Lit.options.canvas = canvas;
    Lit.options.context = canvas.getContext('2d');
}

export function getWindowSize() {
    return {
        width: document.body.offsetWidth,
        height: document.body.offsetHeight,
    }
}

export function getScaledDisplaySize() {
    let [sx, sy] = getScale();
    return {
        width: Lit.options.WIDTH / sx,
        height: Lit.options.HEIGHT / sy
    }
}

export function getDisplaySize() {
    return {
        width: Lit.options.WIDTH,
        height: Lit.options.HEIGHT
    }
}

let _scale = null;

/**
 * @param {{width: number; height: number; scaleX: number; scaleY: number; id: string; type: string}} config
 */
export function set2dDisplayWindow(config) {
    let canvas = document.getElementById(config.id),
    w = config.width || document.body.offsetWidth,
    h = config.height || document.body.offsetHeight,
    sx = config.scaleX || 1,
    sy = config.scaleY || 1;
    Global.scale = _scale = [sx, sy];
    canvas.width = w*sx;
    canvas.height = h*sy;
    canvas.style.cssText = `width: ${w}px; height: ${h}px;`;
    initLitRenderer(h, w, canvas, sx, sy);
}

export function getScale() {
    return _scale;
}

/**
 * @param {import('./lit').RenderObj} renderObj 
 */
export function quickDraw(renderObj) {
    Lit.render(renderObj);
}

export const getUIContainer = (() => {
    let _ui = document.createElement('div');
    const {width, height} = getWindowSize();
    _ui.style.cssText = `width: ${width}px; height: ${height}px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);`;
    document.body.appendChild(_ui);
    return function() {
        return _ui;
    }
})();

export function setUIContainerSize(width, height) {
    let ui = getUIContainer();
    ui.style.width = width + 'px';
    ui.style.height = height + 'px';
}

export const getRegularWindowRes = (aspectRatio, baseWidth) => {
    let {width, height} = getWindowSize();
    const _h = width*(1/aspectRatio);
    width = _h > height? height*aspectRatio: width;
    height = _h > height? height: _h;

    const scale = baseWidth/width;

    return {width, height, scale}
}
