import * as AVG from '../avg/index.js';
import * as R from '../engine/Rabis.js'

export default async () => {
//

const wSize = R.getWindowSize();
const dialogueWSize = AVG.dialogueUI.size();


AVG.createAgent({
    id: '怆怆子',
    source: './example-assest/figure/char.png',
    run: actor => {
        const width = actor._image.naturalWidth;
        const height = actor._image.naturalHeight;

        actor.setOffsetPos((wSize.width - width)/2, wSize.height - height);
    }
}).show();

AVG.createAgent({
    id: '怆怆女仆',
    source: './example-assest/figure/char2.png',
    run: actor => {
        const width = actor._image.naturalWidth/2;
        const height = actor._image.naturalHeight/2;

        actor.width = width;
        actor.height = height;

        actor.setOffsetPos((wSize.width - width)/2, wSize.height - height);
    }
});

const game = await AVG.loadIndexScript('./example-assest/scripts/index.spt');

game.addAction('打印', (...args) => console.log(...args));

game.debuggerAgent(msg => {
    alert(msg);
});

AVG.dialoguePos((wSize.width-dialogueWSize.width)/2, wSize.height - dialogueWSize.height - 10);

AVG.defaultSkipKeyBindings();

R.fpsMeter();


//
}