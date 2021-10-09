import * as sc from './scriptParser.js';
export * from './scriptParser.js';

import * as agent from './agent.js';
const {_createAgent: createCustomAgent, dialogueUI, dialoguePos} = agent;
export {
    dialogueUI, dialoguePos, createCustomAgent
}

export function createAgent(config, dialogable=true) {
    dialogable && sc.agentDialogable(config.id);
    return createCustomAgent(config);
}