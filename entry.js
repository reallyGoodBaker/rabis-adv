import * as Rabis from './engine/Rabis.js';
import init from './assest/main.js';

function main() {

    const {width, height, scale} = Rabis.getRegularWindowRes(4/3, 1400);

    Rabis.set2dDisplayWindow({
        width,
        height,
        scaleX: scale,
        scaleY: scale,
        id: 'game'
    });

    Rabis.setUIContainerSize(width, height);

    const clckEv = Rabis.createEvent('click');
    Rabis.getUIContainer().addEventListener('click', () => {
        clckEv.emit();
    })

    Rabis.bindKeyUp('Escape', () => {
        if (Rabis.Game.state(true) === 'paused') {
            Rabis.Game.resume();
        } else {
            Rabis.Game.pause();
        }
    });

    // window.addEventListener('keydown', ev => console.log(ev.key));

    init();

}

Rabis.execMain(main);