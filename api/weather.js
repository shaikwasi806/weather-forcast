const axios = require('axios');

module.exports = async (req, res) => {
    const { endpoint = 'current', access_key, query, ...params } = req.query;

    if (!access_key || !query) {
        return res.status(400).json({ success: false, error: { info: "Missing access_key or query parameters." } });
    }

    try {
        const url = `http://api.weatherstack.com/${endpoint}`;
        const response = await axios.get(url, {
            params: {
                access_key,
                query,
                ...params
            }
        });

        // Add CORS headers just in case
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Proxy Error:', error.message);
        return res.status(500).json({
            success: false,
            error: { info: `Proxy Error: ${error.message}` }
        });
    }
};
