import * as R from '../engine/Rabis.js';
import {dialogueUI, avgActors} from './agent.js';

class Reader {
    constructor(str) {
        this.data = str;
        this.lineMatcher = /[\r\n]?(.*)[\r\n]?/g;
    }

    readNextLine() {
        const [raw, res] = this.lineMatcher.exec(this.data);
        return res;
    }

    readLineAt(index) {
        this.lineMatcher.lastIndex = index;
        return this.readNextLine();
    }

    readLine(index) {
        if (index) return this.readLineAt(index);
        return this.readNextLine();
    }


}

class Runtime {
    line = 0;
    _agent = new R.EventEmitter();
    _action = new R.EventEmitter();

    load(str) {
        this.reader = new Reader(str);
        return this;
    }

    customAgentDispatcher(agentID, handler) {
        this._agent.on(agentID, handler);
    }

    debuggerAgent(handler) {
        this._agent.on('debugger', handler);
    }

    evalMatched(str) {
        let [raw, _t] = />(.*)/g.exec(str);
        return eval(_t);
    }

    parseDialogue(str) {
        let [raw, _a, _m] = /(.*?):(.*)/.exec(str);
        this.dispatchDialogue(_a, _m);
        return true;
    }

    dispatchDialogue(agent, message) {
        this._agent.emit(agent, message)
    }

    parseAction(str) {
        let [r, _a] = /\[(.*?)\]/.exec(str);
        let res = /(.*?):(.*)/.exec(_a);
        if (res) {
            const [_r, head, args] = res;
            this._action.emit(head, ...args.split(','));
            return this.actionsFlowControl[head];
        } 
        this._action.emit(_a);
        return this.actionsFlowControl[_a];
        
    }

    getNextLine() {
        this.line ++ ;
        return this.reader.readLine();
    }

    runStr(lineStr) {
        if (lineStr[0] == '>') return this.evalMatched(lineStr);
        if (lineStr[0] == '[') return this.parseAction(lineStr);
        if (~lineStr.indexOf(':')) return this.parseDialogue(lineStr);
    }

    runNextLine() {
        return this.runStr(this.getNextLine());
    }

    actionsFlowControl = {};

    addAction(actionType, handler, stopFlow=false) {
        this._action.on(actionType, handler);
        this.actionsFlowControl[actionType] = stopFlow;
    }

    rmAction(actionType) {
        this._action.off(actionType, handler);
    }

    flowLock = true;

    flowStop() {
        this.flowLock = true;
    }

    constructor() {
        R.eachGameTick(() => {
            if (!this.flowLock) {
                this.flowLock = this.runNextLine();
            }
        });
    }
}

const game = new Runtime();

export async function loadIndexScript(path) {
    return game.load(await (await fetch('./example-assest/scripts/index.spt')).text());
}

function showDialogue(msg) {
    if (msg) dialogueUI.text = msg;
    dialogueUI.show();
    dialogueUI.showText();
}

function hideDialogue() {
    dialogueUI.hideText();
    dialogueUI.hide();
}

export function agentDialogable(agentID) {
    game.customAgentDispatcher(agentID, msg => {
        avgActors[agentID].show();
        showDialogue(msg);
    });
}

export function defaultSkipKeyBindings() {
    R.subKeyEv('skip', () => skipDialog(200));
    R.subAxisEv('quick-skip', () => skipDialog(200));
    R.subKeyEv('toggleDialogue', () => {
        if (dialogueUI.__showText) {
            return hideDialogue();
        }
        return showDialogue();
    });
    window.addEventListener('click', () => {
        let _s = R.getEv('skip');
        _s.publish(0);
        _s.distribute();
    });
}

export const skipDialog = (() => {
    let timer = null;
    return ms => {
        if (!timer) {
            timer = setTimeout(() => {
                timer = null;
            }, ms);
            game.flowLock = false;
        } 
    }
})();

function defaultAction() {
    game.addAction('对话框消失', hideDialogue);
    game.addAction('对话框出现', showDialogue);
    game.addAction('等待输入', () => null, true);
    game.addAction('隐藏角色', id => {
        avgActors[id].hide();
    });
}

defaultAction();