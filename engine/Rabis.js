export {
    register, NULLFUNC, eachGameTick, Game, activateActor, createSpirit,
    RabisSpirit as Spirit, getActor, RabisActor as Actor, Vector2D, 
} from './Core.js';
export * from './WindowManager.js';
export * from './Event.js';
export * from './ScriptManager.js';

import {startGame, renderTickGen} from './Core.js';
import {main} from '../entry.js';

export let Global = (function(w) {
    return Object.create(w);
})(window);

async function exec() {    
    Global.returnValMain = main();
    startGame();
}

export function fpsMeter() {
    let div = document.createElement('div');
    let count = 0;
    div.style.cssText = 'position: fixed; left: 0px; top: 0px; background-color:rgba(0,0,0,0.2); padding:4px;color: red; font-weight: bold; user-select: none;';
    renderTickGen.addTickHandler(() => {
        count++;
    });
    setInterval(() => {
        div.innerText = count;
        count = 0;
    }, 1000);
    document.body.appendChild(div);
}

requestAnimationFrame(exec);