export {
    register, NULLFUNC, eachGameTick, Game, activateActor, createSpirit,
    RabisSpirit as Spirit, getActor, RabisActor as Actor, Vector2D, 
} from './Core.js';
export * from './WindowManager.js';
export * from './Event.js';
export * from './ScriptManager.js';

import {startGame} from './Core.js';
import {main} from '../entry.js';

export let Global = (function(w) {
    return Object.create(w);
})(window);

async function exec() {    
    Global.returnValMain = main();
    startGame();
}

requestAnimationFrame(exec);