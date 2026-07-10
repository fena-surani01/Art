const orderModel = require('../models/orderModel');
const customArtModel = require('../models/customArtModel');
const returnModel = require('../models/returnModel');
const db = require('../config/db');

/**
 * Unified logic engine that processes incoming user messages.
 * It is agnostic to the platform (Web Chat, Telegram, etc).
 */
const processMessage = async (messageText, userId = null) => {
    let text = messageText.trim().toLowerCase();
    
    // Normalize Telegram callback data (which replaces spaces with underscores) back to spaces
    text = text.replace(/_/g, ' ');

    // Intent: Track Custom Art
    if (text === 'track custom art' || text === 'track custom' || text === 'custom track' || text === 'custom art track') {
        return new Promise((resolve) => {
            if (userId) {
                customArtModel.getCustomRequestsByUserId(userId, (err, requests) => {
                    if (err || !requests || requests.length === 0) {
                        resolve({
                            text: "To track your Custom Art, please provide your Custom Art Request ID (e.g., REQ-123).",
                            options: ["Orders", "Custom Art"]
                        });
                    } else {
                        const recentRequestIds = requests.slice(0, 3).map(r => `REQ-${r.request_id}`);
                        resolve({
                            text: "Please select one of your recent Custom Art requests to track, or type your ID if it's not listed.",
                            options: recentRequestIds
                        });
                    }
                });
            } else {
                db.query('SELECT request_id FROM custom_requests ORDER BY created_at DESC LIMIT 5', (err, requests) => {
                    if (err || !requests || requests.length === 0) {
                        resolve({
                            text: "To track your Custom Art, please provide your Custom Art Request ID (e.g., REQ-123).",
                            options: ["Orders", "Custom Art"]
                        });
                    } else {
                        const recentRequestIds = requests.map(r => `REQ-${r.request_id}`);
                        resolve({
                            text: "Please select one of your recent Custom Art requests to track, or type your ID if it's not listed.",
                            options: recentRequestIds
                        });
                    }
                });
            }
        });
    }

    // Intent: Orders Menu
    if (text === 'orders' || text === 'order') {
        return {
            text: "Please select an option for your standard orders:",
            options: ["Track Order", "Cancel Order", "Return Order"]
        };
    }

    // Intent: Custom Art Menu
    if (text === 'custom art' || text === 'custom') {
        return {
            text: "Please select an option for your Custom Art requests:",
            options: ["Track Custom Art"]
        };
    }

    // Intent: Track Order
    if ((text.includes('track') || text.includes('status') || text.match(/ord-?\s*\d+/i) || text.match(/^\d+$/)) && !text.includes('cancel') && !text.includes('return') && !text.includes('promptotherreason') && !text.includes('issue ord-')) {
        // Try to extract an order ID like ORD-12345 or just digits
        const match = text.match(/(?:ord-?\s*)?(\d+)/i);
        if (match) {
            const displayOrderId = 'ORD-' + match[1];
            const dbOrderId = parseInt(match[1], 10);
            
            return new Promise((resolve) => {
                orderModel.trackOrder(dbOrderId, (err, order) => {
                    if (err) {
                        console.error('Error tracking order via bot:', err);
                        resolve({
                            text: `Oops, something went wrong while trying to find order ${displayOrderId}.`,
                            options: ["Track Order", "Cancel Order", "Return Order"]
                        });
                    } else if (!order) {
                        resolve({
                            text: `I couldn't find an order with ID: ${displayOrderId}. Please check the ID and try again.`,
                            options: ["Track Order", "Cancel Order", "Return Order"]
                        });
                    } else {
                        const createdDate = new Date(order.created_at);
                        const orderedDateStr = createdDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        let responseText = `Here is the status for **${displayOrderId}**: \n**Status:** ${order.status}\n**Ordered Date:** ${orderedDateStr}\n\n`;
                        
                        if (order.status === 'Delivered') {
                            responseText += `Your order was already delivered. Enjoy your art! 🎉`;
                        } else if (order.status === 'Return Requested') {
                            const pickupStr = order.estimated_pickup ? new Date(order.estimated_pickup).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Soon';
                            responseText += `**Estimated Pickup Date:** ${pickupStr} 🚚`;
                        } else if (order.status === 'Cancelled') {
                            responseText += `This order has been cancelled.`;
                        } else {
                            if (order.status === 'Shipped') {
                                responseText += `Your order has been shipped and is on its way to you! 📦\n\n`;
                            }
                            const estDelivery = new Date(createdDate);
                            estDelivery.setDate(estDelivery.getDate() + 5);
                            
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            const estDay = new Date(estDelivery);
                            estDay.setHours(0,0,0,0);
                            
                            if (estDay.getTime() === today.getTime()) {
                                responseText += `Good news! You will receive your order **Today**! 🚚`;
                            } else {
                                responseText += `**Estimated Delivery Date:** ${estDelivery.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
                            }
                        }
                        resolve({
                            text: responseText,
                            options: ["Orders", "Custom Art"]
                        });
                    }
                });
            });
        } else {
            return new Promise((resolve) => {
                if (userId) {
                    orderModel.getUserOrders(userId, (err, orders) => {
                        if (err || !orders || orders.length === 0) {
                            resolve({
                                text: "Please provide your Order ID. You can find your Order ID in the 'Orders' section of your account (e.g., ORD-12345).",
                                options: []
                            });
                        } else {
                            const trackableOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Delivered');
                            if (trackableOrders.length === 0) {
                                resolve({
                                    text: "You don't have any active orders to track. Please provide an Order ID directly if you are looking for an older order.",
                                    options: ["Orders", "Custom Art"]
                                });
                            } else {
                                const recentOrderIds = trackableOrders.slice(0, 3).map(o => `ORD-${o.order_id}`);
                                resolve({
                                    text: "Please select one of your active orders to track, or type your Order ID if it's not listed.",
                                    options: recentOrderIds
                                });
                            }
                        }
                    });
                } else {
                    // Telegram fallback: fetch global recent orders for easy testing
                    db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5', (err, orders) => {
                        if (err || !orders || orders.length === 0) {
                            resolve({
                                text: "Please provide your Order ID. You can find your Order ID in the 'Orders' section of your account (e.g., ORD-12345).",
                                options: []
                            });
                        } else {
                            const trackableOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Delivered');
                            if (trackableOrders.length === 0) {
                                resolve({
                                    text: "There are no active orders to track. Please provide an Order ID directly.",
                                    options: ["Orders", "Custom Art"]
                                });
                            } else {
                                const recentOrderIds = trackableOrders.slice(0, 3).map(o => `ORD-${o.order_id}`);
                                resolve({
                                    text: "Please select one of the recent active orders to track, or type an Order ID if it's not listed.",
                                    options: recentOrderIds
                                });
                            }
                        }
                    });
                }
            });
        }
    }

    // Intent: Track Custom Art Request
    if (text.match(/req-?\s*\d+/i) || (text.includes('track') && text.match(/req-?\s*\d+/i))) {
        const match = text.match(/(?:req-?\s*)?(\d+)/i);
        if (match) {
            const displayReqId = 'REQ-' + match[1];
            const dbReqId = parseInt(match[1], 10);
            
            return new Promise((resolve) => {
                customArtModel.trackCustomRequest(dbReqId, (err, req) => {
                    if (err) {
                        console.error('Error tracking custom art via bot:', err);
                        resolve({
                            text: `Oops, something went wrong while trying to find request ${displayReqId}.`,
                            options: ["Orders", "Custom Art"]
                        });
                    } else if (!req) {
                        resolve({
                            text: `I couldn't find a Custom Art request with ID: ${displayReqId}. Please check the ID and try again.`,
                            options: ["Orders", "Custom Art"]
                        });
                    } else {
                        const createdDate = new Date(req.created_at);
                        const requestedDateStr = createdDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        let responseText = `Here is the status for **${displayReqId}**: \n**Status:** ${req.payment_status || 'Pending'}\n**Requested Date:** ${requestedDateStr}\n\n`;
                        
                        if (req.payment_status === 'Paid') {
                            responseText += `Your request has been paid for and is in progress! 🎨`;
                        } else if (req.payment_status === 'Cancelled') {
                            responseText += `This request has been cancelled.`;
                        } else {
                            responseText += `We are still reviewing your custom art request. We'll be in touch soon!`;
                        }
                        
                        resolve({
                            text: responseText,
                            options: ["Orders", "Custom Art"]
                        });
                    }
                });
            });
        }
    }

    // Intent: Keep Order
    if (text === 'keep order') {
        return {
            text: "No problem! Your order has not been cancelled.",
            options: ["Orders", "Custom Art"]
        };
    }

    // Intent: Confirm Cancel Order
    if (text.includes('confirm cancel')) {
        const match = text.match(/(?:ord-?\s*)?(\d+)/i);
        if (match) {
            const displayOrderId = 'ORD-' + match[1];
            const dbOrderId = parseInt(match[1], 10);
            
            return new Promise((resolve) => {
                if (!userId) {
                    db.query("UPDATE orders SET status = 'Cancelled' WHERE order_id = ? AND status IN ('Pending', 'Processing')", [dbOrderId], (err, result) => {
                        if (err) {
                            resolve({ text: "Sorry, an error occurred while trying to cancel your order.", options: ["Orders", "Custom Art"] });
                        } else if (result.affectedRows === 0) {
                            resolve({ text: `Sorry, we couldn't cancel ${displayOrderId}. It may have already been shipped.`, options: ["Orders", "Custom Art"] });
                        } else {
                            resolve({ text: `Success! ${displayOrderId} has been successfully cancelled.`, options: ["Orders", "Custom Art"] });
                        }
                    });
                    return;
                }
                orderModel.cancelOrder(dbOrderId, userId, (err, result) => {
                    if (err) {
                        resolve({ text: "Sorry, an error occurred while trying to cancel your order.", options: ["Orders", "Custom Art"] });
                    } else if (result.affectedRows === 0) {
                        resolve({ text: `Sorry, we couldn't cancel ${displayOrderId}. It may have already been shipped or it doesn't belong to you.`, options: ["Orders", "Custom Art"] });
                    } else {
                        resolve({ text: `Success! ${displayOrderId} has been successfully cancelled.`, options: ["Orders", "Custom Art"] });
                    }
                });
            });
        }
    }

    // Intent: Return Order
    if (text === 'return order' || (text.includes('return') && !text.includes('cancel return') && !text.includes('returnreason') && !text.match(/return\s*ord-?/i) && !text.includes('issue ord-'))) {
        return new Promise((resolve) => {
            if (!userId) {
                // Telegram fallback
                db.query("SELECT * FROM orders WHERE status = 'Delivered' ORDER BY created_at DESC LIMIT 3", (err, orders) => {
                    if (err || !orders || orders.length === 0) {
                        resolve({
                            text: "No delivered orders found eligible for return.",
                            options: ["Orders", "Custom Art"]
                        });
                    } else {
                        const returnOrderIds = orders.map(o => `Return ORD-${o.order_id}`);
                        resolve({
                            text: "Please select a delivered order to return for a Refund:",
                            options: returnOrderIds
                        });
                    }
                });
                return;
            }
            orderModel.getUserOrders(userId, (err, orders) => {
                if (err || !orders || orders.length === 0) {
                    resolve({
                        text: "You don't have any orders to return.",
                        options: ["Orders", "Custom Art"]
                    });
                } else {
                    const returnableOrders = orders.filter(o => o.status === 'Delivered');
                    if (returnableOrders.length === 0) {
                        resolve({
                            text: "You don't have any delivered orders eligible for return.",
                            options: ["Orders", "Custom Art"]
                        });
                    } else {
                        const returnOrderIds = returnableOrders.slice(0, 3).map(o => `Return ORD-${o.order_id}`);
                        resolve({
                            text: "Please select a delivered order to return for a Refund:",
                            options: returnOrderIds
                        });
                    }
                }
            });
        });
    }

    // Intent: Select Return Reason (Prompt)
    if (text.match(/return\s*ord-?\s*\d+/i)) {
        const match = text.match(/(?:ord-?\s*)?(\d+)/i);
        if (match) {
            const displayOrderId = 'ORD-' + match[1];
            return {
                text: `Why would you like to return **${displayOrderId}**?`,
                options: [
                    { label: "Different Art?", action: `Confirm ReturnReason ${displayOrderId} Different Art` },
                    { label: "Defective product?", action: `Confirm ReturnReason ${displayOrderId} Defective product` },
                    { label: "Not Like?", action: `Confirm ReturnReason ${displayOrderId} Not Like` },
                    { label: "Other Reason", action: `PromptOtherReason ${displayOrderId}` },
                    { label: "Cancel", action: "Cancel Return Process" }
                ]
            };
        }
    }

    // Intent: Confirm Return Reason
    if (text.includes('confirm returnreason')) {
        const match = text.match(/(?:ord-?\s*)?(\d+)/i);
        if (match) {
            const displayOrderId = 'ORD-' + match[1];
            // Extract the reason from the normalized text to avoid Telegram underscore issues
            const reasonMatch = text.match(/confirm returnreason\s+(?:ord-?\s*\d+)\s+(.+)/i);
            const displayReasonText = reasonMatch && reasonMatch[1] ? reasonMatch[1].trim() : 'this reason';
            const displayReason = displayReasonText.replace(/\b\w/g, l => l.toUpperCase());
            
            return {
                text: `Are you sure you want to return **${displayOrderId}** for reason: **${displayReason}**?`,
                options: [
                    { label: "Yes", action: `ReturnReason ${displayOrderId} ${displayReason}` },
                    { label: "No", action: "Cancel Return Process" }
                ]
            };
        }
    }

    // Intent: Cancel Return Process
    if (text.includes('cancel return process')) {
        return {
            text: "Your return request has been cancelled.",
            options: ["Orders", "Custom Art"]
        };
    }

    // Intent: Prompt Other Reason
    if (text.includes('promptotherreason')) {
        const match = text.match(/(?:ord-?\s*)?(\d+)/i);
        if (match) {
            const displayOrderId = 'ORD-' + match[1];
            return {
                text: `Please describe your issue below for **${displayOrderId}**:`,
                forceInput: `Issue ${displayOrderId}: `,
                options: [{ label: "Cancel", action: "Cancel Return Process" }]
            };
        }
    }

    // Intent: Confirm Other Reason Input
    if (text.includes('issue ord-')) {
        const match = text.match(/(?:ord-?\s*)?(\d+)/i);
        if (match) {
            const displayOrderId = 'ORD-' + match[1];
            // Extract the typed reason
            const parts = messageText.split(':');
            let typedReason = parts.length > 1 ? parts.slice(1).join(':').trim() : 'Other Issue';
            
            return {
                text: `Are you sure you want to return **${displayOrderId}** for reason: **${typedReason}**?`,
                options: [
                    { label: "Yes", action: `ReturnReason ${displayOrderId} Issue: ${typedReason}` },
                    { label: "No", action: "Cancel Return Process" }
                ]
            };
        }
    }

    // Intent: Process Return (Pre-defined or Other)
    if (text.includes('returnreason')) {
        const match = text.match(/(?:ord-?\s*)?(\d+)/i);
        if (match) {
            const displayOrderId = 'ORD-' + match[1];
            const dbOrderId = parseInt(match[1], 10);
            
            let reason = 'Other';
            let otherReason = '';
            
            if (text.includes('different art')) reason = 'Different Art';
            else if (text.includes('defective')) reason = 'Defective product';
            else if (text.includes('not like')) reason = 'Not Like';
            else {
                // Must be an "Issue ORD-XX: <text>" response
                const parts = messageText.split(':');
                if (parts.length > 1) {
                    otherReason = parts.slice(1).join(':').trim();
                } else {
                    otherReason = 'No description provided';
                }
            }
            
            return new Promise((resolve) => {
                if (!userId) {
                    db.query('SELECT user_id FROM orders WHERE order_id = ?', [dbOrderId], (err, res) => {
                        const uId = (res && res[0]) ? res[0].user_id : 1; // Fallback to 1
                        returnModel.addReturnRequest(dbOrderId, uId, reason, otherReason, (err, result) => {
                            if (err) {
                                resolve({ text: "Sorry, an error occurred while trying to process your return.", options: ["Orders", "Custom Art"] });
                            } else {
                                const estPickup = result.estimated_pickup;
                                const pickupDateStr = estPickup.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                resolve({
                                    text: `Success! Your return for **${displayOrderId}** has been requested for a **Refund**.\n\n🚚 **Estimated Pickup Date:** ${pickupDateStr}\n\nOur delivery boy will contact you shortly to pick up the item.`,
                                    options: ["Orders", "Custom Art"]
                                });
                            }
                        });
                    });
                    return;
                }
                returnModel.addReturnRequest(dbOrderId, userId, reason, otherReason, (err, result) => {
                    if (err) {
                        resolve({ text: "An error occurred while trying to process your return.", options: ["Orders", "Custom Art"] });
                    } else {
                        const estPickup = result.estimated_pickup;
                        const pickupDateStr = estPickup.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        resolve({ 
                            text: `Success! Your return for **${displayOrderId}** has been requested for a **Refund**.\n\n🚚 **Estimated Pickup Date:** ${pickupDateStr}\n\nOur delivery boy will contact you shortly to pick up the item.`, 
                            options: ["Orders", "Custom Art"] 
                        });
                    }
                });
            });
        }
    }

    // Intent: Cancel Order
    if (text === 'cancel order' || text.includes('cancel')) {
        const match = text.match(/(?:ord-?\s*)?(\d+)/i);
        if (match) {
            const displayOrderId = 'ORD-' + match[1];
            return {
                text: `Are you sure you want to cancel **${displayOrderId}**? This action cannot be undone.`,
                options: [
                    { label: "Yes", action: `Confirm Cancel ${displayOrderId}` },
                    { label: "No", action: "Keep Order" }
                ]
            };
        } else {
            return new Promise((resolve) => {
                if (userId) {
                    orderModel.getUserOrders(userId, (err, orders) => {
                        if (err || !orders || orders.length === 0) {
                            resolve({
                                text: "You don't have any orders to cancel.",
                                options: ["Orders", "Custom Art"]
                            });
                        } else {
                            const cancelableOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing');
                            if (cancelableOrders.length === 0) {
                                resolve({
                                    text: "You don't have any orders that are eligible for cancellation (only Pending or Processing orders can be cancelled).",
                                    options: ["Orders", "Custom Art"]
                                });
                            } else {
                                const cancelOrderIds = cancelableOrders.slice(0, 3).map(o => `Cancel ORD-${o.order_id}`);
                                resolve({
                                    text: "Please select an order to cancel. Note: This action cannot be undone.",
                                    options: cancelOrderIds
                                });
                            }
                        }
                    });
                } else {
                    // Telegram fallback
                    db.query("SELECT * FROM orders WHERE status IN ('Pending', 'Processing') ORDER BY created_at DESC LIMIT 3", (err, orders) => {
                        if (err || !orders || orders.length === 0) {
                            resolve({
                                text: "There are no pending or processing orders available to cancel.",
                                options: ["Orders", "Custom Art"]
                            });
                        } else {
                            const cancelOrderIds = orders.map(o => `Cancel ORD-${o.order_id}`);
                            resolve({
                                text: "Please select an order to cancel. Note: This action cannot be undone.",
                                options: cancelOrderIds
                            });
                        }
                    });
                }
            });
        }
    }

    // Removed redundant track order block

    // Intent: Greeting
    if (text === 'hi' || text === 'hello' || text === 'start' || text === '/start') {
        return {
            text: "Hello! Welcome to Fenaria. 🎨 Where art finds its true admirers.\n\nI am your automated assistant. How can I help you today?",
            options: ["Orders", "Custom Art"]
        };
    }

    // Fallback
    return {
        text: "I'm not sure I understand that. Please choose a category below to get started.",
        options: ["Orders", "Custom Art"]
    };
};

module.exports = {
    processMessage
};
