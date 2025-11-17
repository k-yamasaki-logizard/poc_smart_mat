// 重量反映ボタンのクラス
class ReflectWeightButton {
    constructor(apiService, reclectButtonElement, productIdInputElement, measureHistoryContainerElement) {
        this.apiService = apiService;
        this.reclectButtonElement = reclectButtonElement;
        this.productIdInputElement = productIdInputElement;
        this.measureHistoryContainerElement = measureHistoryContainerElement;
    }

    async click() {
        // onStart
        this.reclectButtonElement.disabled = true;
        this.reclectButtonElement.innerHTML = '反映中...';

        // 計測結果取得
        const measureHistory = await this.apiService.fetchLatestMeasureHistory();
        if (measureHistory.error) {
            throw new Error(`Failed to fetch latest measure history: ${measureHistory.error}`);
        }
        // onFetchMeasureHistory
        this.renderMeasureHistory(measureHistory);

        // 重量更新
        const updateResult = await this.apiService.updateItemPackageWeight(this.productIdInputElement.value, this.productIdInputElement.value, { caseWeight: measureHistory['current'] });
        if (updateResult.error) {
            throw new Error(`Failed to update item package weight: ${updateResult.error}`);
        }

        // onUpdateItemPackageWeight
        alert("更新しました！");
        console.log(updateResult);

        // onFinish
        this.reclectButtonElement.disabled = false;
        this.reclectButtonElement.innerHTML = '計測結果を反映';
    }

    renderMeasureHistory(measureHistory) {
        // データを整形して表示
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleString('ja-JP');
        };

        this.measureHistoryContainerElement.innerHTML = `
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

export default ReflectWeightButton;