class ApiService {
    constructor(baseUrl, accessToken) {
        this.baseUrl = baseUrl;
        this.accessToken = accessToken;
    }

    async fetchLatestMeasureHistory() {
        const response = await fetch(`${this.baseUrl}/latestMeasureHistory`, {
            headers: {
                'Authorization': this.accessToken
            }
        })
        if (!response.ok) {
            throw new Error('Failed to fetch latest measure history');
        }
        return await response.json();
    }

    async updateItemPackageWeight(itemId, caseBarcode, { caseWeight }) {
        const response = await fetch(`${this.baseUrl}/itemPackageWeight`, {
            method: 'POST',
            headers: {
                'authorization': this.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemId, caseBarcode, caseWeight }),
        })
        if (!response.ok) {
            throw new Error('Failed to update item package weight');
        }
        return await response.json();
    }

    async updateItemPackageSize(itemId, caseBarcode, { caseLength, caseWidth, caseHeight }) {
        const response = await fetch(`${this.baseUrl}/itemPackageSize`, {
            method: 'POST',
            headers: {
                'authorization': this.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemId, caseBarcode, caseLength, caseWidth, caseHeight }),
        })
        if (!response.ok) {
            throw new Error('Failed to update item package size');
        }
        return await response.json();
    }
}

export default ApiService;