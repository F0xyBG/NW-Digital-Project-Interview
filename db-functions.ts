import db from './database';

const dbFunctions = {
    createConversation: () => {
        const stmt = db.prepare('INSERT INTO Conversation DEFAULT VALUES');
        return stmt.run().lastInsertRowid;
    },

    createFlow: (jsonFlow: string) => {
        const stmt = db.prepare('INSERT INTO Flow (Json_flow) VALUES (?)');
        return stmt.run(jsonFlow).lastInsertRowid;
    },

    createChat: (userPrompt: string, botAnswer: string, flowStepTaken: string, conversationId: number) => {
        const stmt = db.prepare(`
            INSERT INTO Chat (user_prompt, bot_answer, flow_step_taken, conversation_id)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(userPrompt, botAnswer, flowStepTaken, conversationId).lastInsertRowid;
    },

    getAllConversations: () => {
        const stmt = db.prepare('SELECT * FROM Conversation');
        return stmt.all();
    },

    getAllFlows: () => {
        const stmt = db.prepare('SELECT * FROM Flow');
        return stmt.all();
    },

    getAllChats: () => {
        const stmt = db.prepare('SELECT * FROM Chat');
        return stmt.all();
    }
};


export default dbFunctions;