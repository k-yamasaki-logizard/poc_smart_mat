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

    async updateWeight(itemId, weight) {
        const response = await fetch(`${this.baseUrl}/weight`, {
            method: 'POST',
            headers: {
                'authorization': this.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itemId, weight }),
        })
        if (!response.ok) {
            throw new Error('Failed to update weight');
        }
        return await response.json();
    }
}

class AppService {
    constructor(appSettings) {
        this.apiService = new ApiService(appSettings.backendUrl, appSettings.accessToken);
    }

    // 計測結果反映処理
    // 本来は、APIエラーとかで細分化
    async reflect(itemId, onStart = () => { }, onFetchMeasureHistory = (measureHistory) => { }, onUpdateWeight = (updateResult) => { }, onFinish = () => { }) {
        try {
            await onStart();
            // 計測結果取得
            const measureHistory = await this.apiService.fetchLatestMeasureHistory();
            await onFetchMeasureHistory(measureHistory);
            if (measureHistory.error) {
                throw new Error(`Failed to fetch latest measure history: ${measureHistory.error}`);
            }

            // 重量更新
            const updateResult = await this.apiService.updateWeight(itemId, measureHistory['current']);
            if (updateResult.error) {
                throw new Error(`Failed to update weight: ${updateResult.error}`);
            }

            onUpdateWeight(updateResult)

        } catch (error) {
            alert(error.message);
            console.error(error);
        }
        finally {
            await onFinish();
        }
    }
}

// アプリのメインクラス
class App {
    constructor(appSettings) {
        this.appSettings = appSettings;
        this.appService = new AppService(appSettings);
    }

    init() {
        // 初期化処理
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // イベントリスナーの設定
        const productIdInput = document.getElementById('productId');
        const reflectBtn = document.getElementById('reflectBtn');
        const onStartUpdate = () => {
            reflectBtn.disabled = true;
            reflectBtn.innerHTML = '反映中...';
        }
        const onFetchMeasureHistory = (measureHistory) => {
            this.renderMeasureHistory(measureHistory);
        }
        const onUpdateWeight = (updateResult) => {
            alert("更新しました！");
            console.log(updateResult);
        }
        const onFinishUpdate = () => {
            reflectBtn.disabled = false;
            reflectBtn.innerHTML = '計測結果を反映';
        }
        reflectBtn.addEventListener('click', () => {
            this.appService.reflect(
                productIdInput.value,
                onStartUpdate,
                onFetchMeasureHistory,
                onUpdateWeight,
                onFinishUpdate,
            );
        });
    }

    render() {
        // レンダリング処理
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = `
                <div id="measureHistoryContainer" class="mt-4 sm:mt-6"></div>
            `;
        }
    }

    renderMeasureHistory(measureHistory) {
        const container = document.getElementById('measureHistoryContainer');
        if (!container) return;

        // データを整形して表示
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleString('ja-JP');
        };

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <h2 class="text-lg sm:text-xl font-bold text-indigo-600 mb-4">最新の計測結果データ</h2>
                <div class="space-y-2 text-sm sm:text-base">
                    ${Object.entries(measureHistory).map(([key, value]) => {
            let displayValue = value;
            if (value === null || value === undefined) {
                displayValue = 'N/A';
            } else if (typeof value === 'object') {
                displayValue = JSON.stringify(value, null, 2);
            } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
                displayValue = formatDate(value);
            }
            return `
                            <div class="border-b border-gray-200 pb-2">
                                <div class="font-semibold text-gray-700 mb-1">${key}</div>
                                <div class="text-gray-600 break-words">${displayValue}</div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }
}

// アプリを初期化
// アプリ内データ
const AppSettings = {
    backendUrl: "/api",
    accessToken: "1234567890",
}
const app = new App(AppSettings);
app.init();
