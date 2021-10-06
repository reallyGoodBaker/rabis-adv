import * as AVG from '../avg/scriptParser.js';

export default async () => {
//
const game = await AVG.loadIndexScript('./example-assest/scripts/index.spt');

game.debuggerAgent(msg => {
    console.log('debugger: ' + msg);
});

game.customAgentDispatcher('少女', msg => {

});

let i = 10;
while(i--) {
    game.runStr(game.getNextLine());
    console.log(game.reader.lineMatcher.lastIndex);
}


//
}