import * as R from '../engine/Rabis.js';

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

export class Runtime {
    line = 0;
    _agent = new R.EventEmitter();
    _action = R.createEv('__action', 1);

    load(str) {
        this.reader = new Reader(str);
        return this;
    }

    customAgentDispatcher(agentID, handler) {
        this._agent.on(agentID, handler);
    }

    debuggerAgent(handler) {
        this._agent.on('__debugger', handler);
    }

    evalMatched(str) {
        let [raw, _t] = />(.*)/g.exec(str);
        return eval(_t);
    }

    parseDialogue(str) {
        let [raw, _a, _m] = /(.*?):(.*)/.exec(str);
        this.dispatchDialogue(_a, _m);
    }

    dispatchDialogue(agent, message) {
        this._agent.emit(agent, message)
    }

    parseAction(str) {
        let [raw, _a] = /\[(.*?)\]/.exec(str);
        this._action.distribute();
    }

    getNextLine() {
        this.line ++ ;
        return this.reader.readLine();
    }

    runStr(lineStr) {
        if (lineStr[0] == '>') return this.evalMatched(lineStr);
        if (~lineStr.indexOf(':')) return this.parseDialogue(lineStr);
        if (lineStr[0] == '[') return this.parseAction(lineStr);
    }
}

const game = new Runtime();

export async function loadIndexScript(path) {
    return game.load(await (await fetch('./example-assest/scripts/index.spt')).text());
}

class AVGActorFactory {
    createAgentActor(agentID) {
        this.actor = new R.Actor(agentID);
    }
}