export {
    register, NULLFUNC, eachGameTick, offEachGameTick, Game, activateActor, createSpirit,
    RabisSpirit as Spirit, getActor, RabisActor as Actor, Vector2D, addComponent,
    RabisComponent as Component, 
} from './Core.js';
export * from './WindowManager.js';
export * from './Event.js';
export * from './ScriptManager.js';
export * from './FileManager.js';

import {startGame, renderTickGen, } from './Core.js';
import {getUIContainer} from './WindowManager.js';

export let Global = (function(w) {
    return Object.create(w);
})(window);

export function execMain(mainFunc) {
    Global.returnValMain = mainFunc();
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
    getUIContainer().appendChild(div);
}