import * as Rabis from './engine/Rabis.js';
import init from './example-assest/main.js';

function main() {

    Rabis.setDisplayWindow({
        id: 'game',
        type: '2d'
    });

    let showMenu = false;

    Rabis.createAxisEv('quick-skip', 'Control', 1);
    Rabis.createKeyEv('skip', 'Enter', 1);
    Rabis.createKeyEv('toggleDialogue', ' ', 1);
    Rabis.createKeyEv('menu', 'Escape', () => showMenu = !showMenu);

    Rabis.createEv('hideHUD', 1);

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

export {
    main,
}