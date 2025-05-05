import db from './Database';

const dbFunctions = {
    createConversation: () => {
        const stmt = db.prepare('INSERT INTO Conversation DEFAULT VALUES');
        return stmt.run().lastInsertRowid;
    },

    createUpdateFlow: (jsonFlow: string) => {
        const deleteStmt = db.prepare('DELETE FROM Flow');
        const insertStmt = db.prepare('INSERT INTO Flow (Json_flow) VALUES (?)');

        const existingFlow = db.prepare('SELECT COUNT(*) AS count FROM Flow').get() as { count: number };

        if (existingFlow.count > 0) {
            deleteStmt.run();
        }

        return insertStmt.run(jsonFlow).lastInsertRowid;
    },

    createChatResponse: (userPrompt: string, botAnswer: string, flowStepTaken: string, conversationId: number) => {
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

    getFlow: () => {
        const stmt = db.prepare('SELECT Json_flow FROM Flow');
        return stmt.all();
    },

    getAllChats: () => {
        const stmt = db.prepare('SELECT * FROM Chat');
        return stmt.all();
    }
};

export default dbFunctions;

