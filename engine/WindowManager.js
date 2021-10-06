import Lit from './lit.js';
import {ErrorBuilder, hideStack} from './Errors.js';
import {Global} from './Rabis.js';

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

/**
 * @param {{width: number; height: number; scaleX: number; scaleY: number; id: string; type: string}} config
 */
export function setDisplayWindow(config) {
    let canvas = document.getElementById(config.id),
    w = config.width || document.body.offsetWidth,
    h = config.height || document.body.offsetHeight,
    sx = config.scaleX || 1,
    sy = config.scaleY || 1;
    Global.scale = {
        x: sx,
        y: sy
    };
    canvas.width = w*sx;
    canvas.height = h*sy;
    canvas.style.cssText = `width: ${w}px; height: ${h}px;`;
    if (config.type === '3d') return hideStack(ErrorBuilder('[Unsupported]')('暂不支持3d环境')).throwThis();
    else return initLitRenderer(h, w, canvas, sx, sy);
}

/**
 * @param {import('./lit').RenderObj} renderObj 
 */
export function quickDraw(renderObj) {
    Lit.render(renderObj);
}