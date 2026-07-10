let TelegramBot = require('node-telegram-bot-api');
if (typeof TelegramBot === 'object' && TelegramBot.default) TelegramBot = TelegramBot.default;
else if (typeof TelegramBot === 'object' && TelegramBot.TelegramBot) TelegramBot = TelegramBot.TelegramBot;
const automationEngine = require('../controller/automationEngine');

const initTelegramBot = () => {
    // Note: Usually put token in .env file (e.g. process.env.TELEGRAM_BOT_TOKEN)
    const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN'; 
    
    // We only start the bot if the token is valid, to prevent crashing
    if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
        console.warn('⚠️ Telegram Bot Token not set. Telegram bot will not be active.');
        return;
    }

    const bot = new TelegramBot(token, { 
        polling: {
            params: {
                allowed_updates: ['message', 'callback_query']
            }
        } 
    });

    // ULTIMATE DEBUG: Log every single raw update received from Telegram
    const originalProcessUpdate = bot.processUpdate;
    bot.processUpdate = function (update) {
        console.log('🔍 RAW TELEGRAM UPDATE:', JSON.stringify(update));
        return originalProcessUpdate.apply(this, arguments);
    };

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        let text = msg.text;

        if (!text) return;
        
        // Handle ForceReply for Return Issue
        if (msg.reply_to_message && msg.reply_to_message.from.is_bot) {
            const botMessageText = msg.reply_to_message.text;
            const match = botMessageText.match(/issue below for (ORD-\d+):/i);
            if (match) {
                text = `Issue ${match[1]}: ${text}`;
            }
        }

        try {
            // Send the message to our unified automation engine
            const reply = await automationEngine.processMessage(text);
            
            let replyText = reply;
            let options = { parse_mode: 'HTML' };

            if (typeof reply === 'object' && reply !== null) {
                replyText = reply.text;
                if (reply.options && reply.options.length > 0) {
                    options.reply_markup = {
                        inline_keyboard: reply.options.map(opt => {
                            const label = typeof opt === 'object' ? opt.label : opt;
                            const action = typeof opt === 'object' ? opt.action : opt;
                            return [{ 
                                text: label, 
                                callback_data: action.toLowerCase().replace(/\s+/g, '_').substring(0, 64)
                            }];
                        })
                    };
                }
            }

            // Parse markdown bold to HTML bold for Telegram
            replyText = replyText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

            // Send back the reply via Telegram
            bot.sendMessage(chatId, replyText, options);
        } catch (error) {
            console.error('Error in Telegram Bot processing:', error);
            bot.sendMessage(chatId, "Sorry, I encountered an internal error.");
        }
    });

    // Handle Inline Keyboard Button Clicks
    bot.on('callback_query', async (callbackQuery) => {
        console.log('🔘 TELEGRAM INLINE BUTTON CLICKED:', callbackQuery.data);
        const msg = callbackQuery.message;
        const text = callbackQuery.data; // e.g., "track_order"
        const chatId = msg.chat.id;

        try {
            // Acknowledge the button click immediately so the loading spinner stops
            bot.answerCallbackQuery(callbackQuery.id).catch(console.error);

            // Process the action using the same engine (it works because it checks for keywords like 'track', 'cancel')
            const reply = await automationEngine.processMessage(text);
            
            let replyText = reply;
            let options = { parse_mode: 'HTML' };

            if (typeof reply === 'object' && reply !== null) {
                replyText = reply.text;
                
                if (reply.forceInput) {
                    options.reply_markup = {
                        force_reply: true,
                        input_field_placeholder: reply.forceInput
                    };
                    
                    replyText = replyText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                    await bot.sendMessage(chatId, replyText, options);
                    
                    if (reply.options && reply.options.length > 0) {
                        const optionsMarkup = {
                            reply_markup: {
                                inline_keyboard: reply.options.map(opt => {
                                    const label = typeof opt === 'object' ? opt.label : opt;
                                    const action = typeof opt === 'object' ? opt.action : opt;
                                    return [{ 
                                        text: label, 
                                        callback_data: action.toLowerCase().replace(/\s+/g, '_').substring(0, 64)
                                    }];
                                })
                            }
                        };
                        await bot.sendMessage(chatId, "Or choose an option:", optionsMarkup);
                    }
                    return;
                } else if (reply.options && reply.options.length > 0) {
                    options.reply_markup = {
                        inline_keyboard: reply.options.map(opt => {
                            const label = typeof opt === 'object' ? opt.label : opt;
                            const action = typeof opt === 'object' ? opt.action : opt;
                            return [{ 
                                text: label, 
                                callback_data: action.toLowerCase().replace(/\s+/g, '_').substring(0, 64)
                            }];
                        })
                    };
                }
            }

            // Parse markdown bold to HTML bold for Telegram
            replyText = replyText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

            bot.sendMessage(chatId, replyText, options);
        } catch (error) {
            console.error('Error in Telegram callback query:', error);
            bot.sendMessage(chatId, "Sorry, I encountered an internal error.");
        }
    });

    bot.on('polling_error', (error) => {
        console.error('🚨 TELEGRAM POLLING ERROR:', error);
    });

    bot.on('error', (error) => {
        console.error('🚨 TELEGRAM GENERAL ERROR:', error);
    });

    console.log('🤖 Telegram Bot Service started.');
};

module.exports = {
    initTelegramBot
};
