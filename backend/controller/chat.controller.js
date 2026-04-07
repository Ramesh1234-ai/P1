import express, { text } from "express";
export const ChatModeration = async () => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            input: text,
        });
        const result = response.result[0];
        return {
            flagged: result.flagged,
            categories: result.categories,
            score: result.categories.scores,
        }
    } catch (error) {
        console.error("Gemini Error:", error);
        return res.status(400).json({
            success: false,
            error: "Failed to generate response",
        });
    }
};