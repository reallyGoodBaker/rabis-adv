import * as R from '../engine/Rabis.js';
import {activateActor, renderTickGen, Vector2D} from '../engine/Core.js';
import lit from '../engine/lit.js'

class AVGAgent {
    _show = true;
    constructor(agentID, imageSrc) {
        this.actor = new R.Spirit(agentID, imageSrc);
        this.actor.render = renderConf => {
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

export let avgActors = {};

export function _createAgent(config) {
    const {id, source, run} = config;
    let _avg = new AVGAgent(id, source);
    run(_avg.actor);
    activateActor(_avg.actor);
    avgActors[id] = _avg;
    _avg.hide();
    return _avg;
}

class UIAgent extends AVGAgent {
    text = 'Text';
    textDecoration = {
        size: '24px'
    };
    ox = 20;
    oy = 40;
    _renderFunc = () => lit.render({
        type: 'text',
        x: this.actor.ox + this.ox,
        y: this.actor.oy + this.oy,
        width: 700,
        text: this.text,
        color: 'black',
        textDecoration: this.textDecoration,
    })
    showText() {
        if (!this.__showText) renderTickGen.addTickHandler(this._renderFunc);
        this.__showText = true;
    }
    hideText() {
        if (this.__showText) renderTickGen.rmTickHandler(this._renderFunc);
        this.__showText = false;
    }
    // constructor(...args) {
    //     super(...args);
    //     this.hide();
    // }

}

export let dialogueUI = new UIAgent('dialogue-ui', './example-assest/UI/dialogue.png');

export function dialoguePos(x, y) {
    activateActor(dialogueUI.actor);
    dialogueUI.actor.mountComponent('movement', comp => {
        comp.setOffset(new Vector2D(x, y));
        return comp;
    });
}
