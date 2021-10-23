import * as ADV from '../adv/index.js';
import * as R from '../engine/Rabis.js'

const {Resource} = R;

export default async () => {
//

const uiBundle = Resource.createBundle()
.set('layout', 'text', './assest/UI/layout.html')
.set('dialogue', 'img', './assest/UI/dialogue.png');

const figureBundle = Resource.createBundle()
.set('normal', 'img', './assest/figure/char.png')
.set('maid', 'img', './assest/figure/char2.png')
.set('bgc', 'img', './assest/figure/bgc1.jpg');

const resource = Resource.createBundle('main')
.set('ui', 'bundle', uiBundle)
.set('figure', 'bundle', figureBundle)
.set('index-script', 'text', './assest/scripts/index')


let _loadingUI = (() => {
    let div = document.createElement('div');
    document.body.appendChild(div);
    div.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 32px; color: #fff';
    return {
        setData(str) {
            div.innerText = str*100 + '%';
            if (str == 1) {
                div.remove();
            }
        }
    }
})();

resource.on('counterChange', ev => {
    const {size, counter} = ev;
    _loadingUI.setData(counter/size);
});

const mainScene = ADV.loadIndexScript(await Resource.get('main/index-script'));

mainScene.createAgent({
    id: '背景',
    source: await Resource.get('main/figure/bgc'),
    run: actor => {
        let wSize = R.getDisplaySize();
        let scale = R.getScale()[0];
        let [rw, rh] = actor.getRawSize();
        actor.height = wSize.height / scale;
        actor.width = actor.height * rw / rh;
    }
}).show();

mainScene.createAgent({
    id: '怆怆子',
    source: await Resource.get('main/figure/normal'),
    run: actor => {
        actor.mountComponent('align', c => {
            c.align('center', 'end');
            return c;
        });
    }
});

mainScene.createAgent({
    id: '怆怆女仆',
    source: await Resource.get('main/figure/maid'),
    run: actor => {
        actor.mountComponent('align', c => {
            c.align('end', 'end', -100);
            return c;
        });
    }
});

mainScene.addAction('打印', (...args) => console.log(...args));

mainScene.debuggerAgent(msg => {
    console.log(msg);
});



// R.fpsMeter();

const UI = ADV.UI;

const _ui = UI.createView(await Resource.get('main/ui/layout'));

_ui.setState(state => {

    function toggle() {
        if (this.getAttribute('select') != '1') {
            return this.setAttribute('select', '1');
        }
        return this.setAttribute('select', '0');
    }

    state['skip:on:click'] = toggle;

    let hide = [false, null];
    state['hide:on:click'] = function(ev) {
        hide[1] = _ui.style.display;
        hide[0] = true;
        _ui.style.display = 'none';
        ev.stopPropagation();
    }

    const act = R.createEvent('next-action');

    R.subEvent('click', () => {
        if (hide[0]) {
            _ui.style.display = hide[1];
            hide[1] = null;
            hide[0] = false;
        } else {
            act.emit();
        }
    });

    ADV.bindActionEvent('next-action', mainScene);

    let flow = mainScene.getFlow();
    state['progress:on:click'] = function(ev) {
        let rate = ev.offsetX/this.offsetWidth;
        let index = Math.floor(rate*flow._size);
        flow.goto(index);
    }

});

UI.mountView(_ui);


ADV.defaultOnMsg(_ui);

mainScene.onFlowProgressChange(val => {
    _ui.setState({
        progress: val
    });
})


//
}