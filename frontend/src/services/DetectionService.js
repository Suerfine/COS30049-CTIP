export const DetectionService = {
    // POST: analyze camera frame on the AI Server using Base64 JSON
    analyzeFrame: async (imageBase64, userId, aiHost, aiPort) => {
        try {
            // Construct absolute URL to hit the AI Server directly
            const endpoint = (aiHost && aiPort) 
                ? `http://${aiHost}:${aiPort}/detect`
                : 'http://localhost:8000/detect';

            // Clean the Base64 string to prevent Python "Incorrect padding" errors
            let cleanBase64 = imageBase64;
            
            // 1. Remove the data URI metadata prefix if Expo added one
            if (cleanBase64.includes(',')) {
                cleanBase64 = cleanBase64.split(',')[1];
            }
            
            // 2. Pad the Base64 string with '=' so its length is a perfect multiple of 4
            const paddingNeeded = cleanBase64.length % 4;
            if (paddingNeeded > 0) {
                cleanBase64 += '='.repeat(4 - paddingNeeded);
            }

            // CRITICAL FIX: Bypass FormData entirely.
            // Sending standard JSON with Base64 avoids all React Native 422 File Upload bugs.
            const response = await fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    image_base64: cleanBase64,
                    user_id: userId ? parseInt(userId) : 1
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error(`\n❌ AI Server Error Details:\n`, errorData, `\n`);
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            // Silently return null on frame failures to prevent the UI from crashing
            return null;
        }
    }
};