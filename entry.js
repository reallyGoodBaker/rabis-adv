import * as Rabis from './engine/Rabis.js';
import init from './example-assest/main.js';

function main() {

    Rabis.setDisplayWindow({
        id: 'game',
        type: '2d'
    });

    let showMenu = false;

    Rabis.createAxisEv('Ctrl', 'quick-skip', 1);
    Rabis.createKeyEv('BackSpace', 'skip', 1);
    Rabis.createKeyEv('Escape', 'menu', () => showMenu = !showMenu);

    Rabis.createEv('hideHUD', 1);

    Rabis.bindKeyUp('Escape', () => {
        if (Rabis.Game.state(true) === 'paused') {
            Rabis.Game.resume();
        } else {
            Rabis.Game.pause();
        }
    });

    init();

}

export {
    main,
}