import Lit from './lit.js';
import {activateActor, getActor} from './Core.js';
import {Global} from './Rabis.js';

function initClass(componentClass, ...args) {
      return new componentClass(...args);
}

export function mountClass(componentClass, ...args) {
      return activateActor(initClass(componentClass, ...args));
}

export function mountClassTo(id, componentClass, ...args) {
      let Class = initClass(componentClass, ...args),
      parent = getActor(id);
      Class.extend(parent);
      activateActor(Class);
      return parent;
}