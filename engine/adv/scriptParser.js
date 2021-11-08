import * as R from '../Rabis.js';
import {createCustomAgent, } from './agent.js';

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

class FlowController {
    _cmds = [];
    _index = 0;
    _size = 0;
    _ev = new R.EventEmitter();

    init(scene) {
        this._ev.on('once', v => {
            const [act, data] = v;
            scene.getDispatchFunc(act)(data);
            if (this._index + 1 == this._size) {
                this._ev.emit('done', this._size);
            }
        });
    }

    on(tag, handler) {
        this._ev.on(tag, handler);
    }

    off(tag, handler) {
        this._ev.off(tag, handler);
    }

    add(cmd) {
        this._cmds.push(cmd);
        this._size++;
    }

    execOnce() {
        if (this._index >= this._size) return;
        let i = this._index++;
        this._ev.emit('once', this._cmds[i]);
        this._ev.emit('progress-change', this.getProgress());
    }

    goto(index) {
        let size = this._size, i = this._index;
        if (index >= size || index <= -size) return;
        if (index < 0) index = size - 1 + index;
        this._ev.emit('goto', this._cmds[index], this._index, index);
        this._index = index;
        this._ev.emit('progress-change', this.getProgress());
    }

    getProgress() {
        return this._index/this._size;
    }

}

class Runtime {
    line = 0;
    _agent = new R.EventEmitter();
    _action = new R.EventEmitter();
    _flow = new FlowController();

    static Eval = 0;
    static Dialog = 1;
    static Action = 2;


    customAgentDispatcher(agentID, handler) {
        this._agent.on(agentID, handler);
    }

    debuggerAgent(handler) {
        this._agent.on('debugger', handler);
    }

    evalMatched(str) {
        let [raw, _t] = />(.*)/g.exec(str);
        return [0, {str: _t}];
    }

    parseDialogue(str) {
        let [raw, _a, _m] = /(.*?):(.*)/.exec(str);
        return [1, {
            agent: _a,
            message: _m
        }];
    }

    parseAction(str) {
        const reg = /\[(.*?)\]/;
        if (!reg.test(str)) throw SyntaxError('"["必须与"]"配对');
        let [r, _a] = reg.exec(str);
        let res = /(.*?):(.*)/.exec(_a);
        if (res) {
            const [_r, head, args] = res,
            _args = args.split(',');
            return [2, {
                actionName: head,
                args: _args
            }];
        } 
        return [2, {actionName: _a, args: []}];
    }

    dispatchEval = (data) => {
        eval(data.str);
    }

    dispatchDialogue = (data) => {
        const {agent, message} = data;
        this._agent.emit(agent, message);
    }

    dispatchAction = (data) => {
        const {actionName, args} = data;
        this._action.emit(actionName, ...args);
    }

    getDispatchFunc(type) {
        if (type === 0) return this.dispatchEval;
        if (type === 1) return this.dispatchDialogue;
        if (type === 2) return this.dispatchAction;
    }

    getNextLine() {
        this.line ++ ;
        return this.reader.readLine();
    }

    genFlow() {
        let str;
        while (str = this.getNextLine()) {
            let cmd = this.genCmd(str);
            if (Array.isArray(str)) return this._flow.add(...cmd);
            this._flow.add(cmd);
        }
    }

    genCmd(str) {
        return this.parseStr(str);
    }

    parseStr(lineStr) {
        if (lineStr[0] == '>') return this.evalMatched(lineStr);
        if (lineStr[0] == '[') return this.parseAction(lineStr);
        if (~lineStr.indexOf(':')) return this.parseDialogue(lineStr);
    }

    addAction(actionType, handler) {
        this._action.on(actionType, handler);
    }

    rmAction(actionType) {
        this._action.off(actionType, handler);
    }

    _readSavedData = savedData => {
        for (const key in savedData) {
            const _data = savedData[key];
            const {x, y, show} = _data;
            const actor = R.getActor(key);
            actor.setOffsetPos(x, y);
            show? actor.show(): actor.hide();
        }
    }

    _savedDataInstance = [];

    save = savedData => {
        this._savedDataInstance.push({data: savedData, time: new Date().getTime(), index: this._flow._index});
    }

    quickSave = () => {
        let flow = this._flow;
        let d = flow._cmds[flow._index].savedData;
        this.save(d);
    }

    load = index => {
        let savedData = this._savedDataInstance[index];
        this._flow.goto(savedData.index);
        this._readSavedData(savedData.data);
    }

    saves() {
        return this._savedDataInstance;
    }

    refreshDialogue(ui, data) {
        const {agent, message} = data[1];
        ui.setState({
            name: agent,
            message
        });
    }

    constructor() {
        this._flow.init(this);

        this._flow.on('once', data => {
            if (data.savedData) return;
            if (data[0] === 0 || data[0] === 2) return;
            data.savedData = {};
            this._agents.forEach(id => {
                const actor = R.getActor(id),
                [x, y] = actor.getOffsetPos();
                data.savedData[id] = {
                    show: actor._show,
                    x, y
                }
            });

        });

        this._flow.on('goto', data => {
            if (!data.savedData) return;
            this._readSavedData(data.savedData);
        });

    }

    runNextCmd() {
        this._flow.execOnce();
    }

    _agents = [];

    /**
     * @param {{id: string; source: any; run: (actor: import('./agent.js').AVGAgent) => void}} config 
     * @returns 
     */
    createAgent(config) {
        let _agent = createCustomAgent(config);
        this._agents.push(config.id);
        return _agent;
    }

    onFlowProgressChange(handler) {
        return this._flow.onProgressChange(handler);
    }

    getFlow() {
        return this._flow;
    }

}


function _loadScript(script) {
    let rt = new Runtime();
    rt.reader = new Reader(script);
    rt.genFlow();
    return rt;
}

export function loadIndexScript(script) {
    const game = _loadScript(script);
    defaultAction(game);
    return game;
}

function defaultAction(scene) {
    scene.addAction('等待输入', () => null);
    scene.addAction('隐藏角色', id => {
        R.getActor(id).hide();
    });
    scene.addAction('移动', (agent, x, y, time=400) => {
        scene.runNextCmd();
        return _getAgentInterpolator(agent).pos(time, x, y);
    });
}

function _getAgentInterpolator(agent) {
    agent = R.getActor(agent);
    let c = agent.getComponent('avg-interpolator');
    if (!c) { 
        agent.mountComponent('avg-interpolator', c=>c);
        c = agent.getComponent('avg-interpolator');
    }
    return c;
}

export function bindActionEvent(eventTag, scene) {
    R.subEvent(eventTag, () => {
        scene.runNextCmd();
    });
}



