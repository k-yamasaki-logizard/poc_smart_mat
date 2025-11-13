class SmartMatApiClient {
    constructor(baseUrl, appKey, serialId) {
        this.baseUrl = baseUrl;
        this.appKey = appKey;
        this.serialId = serialId;
    }

    async fetchLatestMeasureHistory() {
        const response = await fetch(`${this.baseUrl}/v1/device/history?id=${this.serialId}&limit=1`, {
            method: 'GET',
            headers: {
                'X-SmartMat-Key': this.appKey,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data['measureHistories'][0];
    }
}

module.exports = SmartMatApiClient;

