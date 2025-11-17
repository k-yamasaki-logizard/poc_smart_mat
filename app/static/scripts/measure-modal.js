// サイズ計測モーダルクラス
class MeasureModal {
    constructor(apiService, productIdInputElement, measureModalElement, openBtnElement, closeBtnElement, resultContainerElement, resultContentElement, updateButtonElement) {
        // モーダル要素の取得
        this.apiService = apiService;
        this.productIdInputElement = productIdInputElement;
        this.measureModalElement = measureModalElement;
        this.openBtnElement = openBtnElement;
        this.closeBtnElement = closeBtnElement;
        this.resultContainerElement = resultContainerElement;
        this.resultContentElement = resultContentElement;
        this.updateButtonElement = updateButtonElement;

        // 状態管理
        this.currentIndex = 0;
        this.draggedItem = null;
        this.previousHighlight = null;
        this.labelsList = ['縦', '横', '高さ'];

        // 測定結果を保持（縦/横/高さと数値の1:1対応）
        this.measurementResult = {
            'length': '',
            'width': '',
            'height': ''
        };

        // 要素の参照（初期化時に設定）
        this.inputs = null;
        this.contentCells = null;

        // イベントリスナーの設定
        this.setupEventListeners();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        this.openBtnElement.addEventListener('click', () => this.open());
        this.closeBtnElement.addEventListener('click', () => this.close());

        this.measureModalElement.addEventListener('click', (e) => {
            if (e.target === this.measureModalElement) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.measureModalElement.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    // モーダルを開く
    open() {
        this.measureModalElement.classList.remove('hidden');
        this.measureModalElement.classList.add('flex');
        this.init();
    }

    // モーダルを閉じる
    close() {
        this.measureModalElement.classList.add('hidden');
        this.measureModalElement.classList.remove('flex');
    }

    // モーダル内の初期化処理
    init() {
        this.inputs = this.measureModalElement.querySelectorAll('.measurement-input');
        this.contentCells = this.measureModalElement.querySelectorAll('[draggable="true"]');

        this.setupInputEvents();
        this.setupDragAndDropEvents();
        this.setupClickFocus();

        this.setActiveInput(0);
    }

    // 入力フィールドのイベント設定
    setupInputEvents() {
        this.inputs.forEach((input, index) => {
            input.addEventListener('click', () => {
                if (index > 0 && this.inputs[index - 1].value === '') {
                    alert('前の位置から順番に測定してください。');
                    return;
                }
                this.setActiveInput(index);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % this.inputs.length;
                    this.setActiveInput(nextIndex);
                }
            });
        });
    }

    // ドラッグ&ドロップのイベント設定
    setupDragAndDropEvents() {
        this.contentCells.forEach((cell, index) => {
            // PCのドラッグ&ドロップ
            cell.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
            cell.addEventListener('dragend', () => this.handleDragEnd());
            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => this.handleDrop(e, index));

            // タッチデバイス対応
            cell.addEventListener('touchstart', (e) => this.handleDragStart(e, index));
            cell.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target && target.hasAttribute('draggable')) {
                    const dropIndex = Array.from(this.contentCells).indexOf(target);
                    if (dropIndex !== -1) {
                        this.highlightTarget(target);
                    }
                }
            });
            cell.addEventListener('touchend', (e) => {
                const touch = e.changedTouches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                if (target && target.hasAttribute('draggable')) {
                    const dropIndex = Array.from(this.contentCells).indexOf(target);
                    if (dropIndex !== -1) {
                        this.handleDrop(e, dropIndex);
                    }
                }
                this.handleDragEnd();
            });
        });
    }

    // クリック時のフォーカス制御
    setupClickFocus() {
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('measurement-input') &&
                this.currentIndex !== null &&
                !this.measureModalElement.classList.contains('hidden')) {
                if (this.inputs[this.currentIndex]) {
                    this.inputs[this.currentIndex].focus();
                }
            }
        });
    }

    // アクティブな入力フィールドを設定
    setActiveInput(index) {
        this.inputs.forEach((input, i) => {
            if (i === index) {
                input.classList.add('bg-yellow-50', 'border-blue-500');
                input.focus();
            } else {
                input.classList.remove('bg-yellow-50', 'border-blue-500');
            }
        });
        this.currentIndex = index;
    }

    // ドラッグ開始
    handleDragStart(e, index) {
        this.draggedItem = {
            index: index,
            label: this.labelsList[index]
        };
        this.contentCells[index].classList.add('opacity-50', 'bg-gray-200');
    }

    // ドラッグ終了
    handleDragEnd() {
        this.contentCells.forEach(cell => {
            cell.classList.remove('opacity-50', 'bg-gray-200', 'bg-gray-300');
        });
        this.draggedItem = null;
    }

    // ドロップ処理
    handleDrop(e, dropIndex) {
        e.preventDefault();
        if (!this.draggedItem || this.draggedItem.index === dropIndex) return;

        const draggedIndex = this.draggedItem.index;

        // ラベルを入れ替え
        const tempLabel = this.labelsList[dropIndex];
        this.labelsList[dropIndex] = this.labelsList[draggedIndex];
        this.labelsList[draggedIndex] = tempLabel;

        // 測定結果のキーを取得
        const getMeasurementKey = (label) => {
            switch (label) {
                case '縦': return 'length';
                case '横': return 'width';
                case '高さ': return 'height';
                default: return null;
            }
        };

        const draggedLabel = this.draggedItem.label;
        const dropLabel = tempLabel;

        const draggedKey = getMeasurementKey(draggedLabel);
        const dropKey = getMeasurementKey(dropLabel);

        // 測定結果も入れ替え（登録済みの値がある場合）
        if (draggedKey && dropKey) {
            const tempMeasurement = this.measurementResult[draggedKey];
            this.measurementResult[draggedKey] = this.measurementResult[dropKey];
            this.measurementResult[dropKey] = tempMeasurement;
        }

        // ラベル表示を更新
        this.contentCells.forEach((cell, i) => {
            cell.textContent = this.labelsList[i];
            cell.dataset.label = this.labelsList[i];
            cell.classList.remove('bg-gray-300');
        });

        this.setActiveInput(this.currentIndex);

        // 測定値の位置はそのままにして、confirmイベントを再実行
        // すべての入力値が入力されている場合のみ実行
        if (Array.from(this.inputs).every(input => input.value !== '')) {
            this.confirm();
        }
    }

    // ドラッグ中のターゲットハイライト
    highlightTarget(target) {
        if (this.previousHighlight === target) return;

        this.contentCells.forEach(cell => {
            cell.classList.remove('bg-gray-300');
        });

        if (target && target !== this.contentCells[this.draggedItem.index]) {
            target.classList.add('bg-gray-300');
        }

        this.previousHighlight = target;
    }

    // リセット処理
    reset() {
        // 保持した計測結果を削除
        this.measurementResult = {
            'length': '',
            'width': '',
            'height': ''
        };

        // 入力フィールドをクリア
        this.inputs.forEach(input => {
            input.value = '';
            input.classList.remove('bg-yellow-50', 'border-blue-500');
        });

        this.resultContainerElement.classList.add('hidden');

        const firstInput = this.inputs[0];
        if (firstInput) {
            firstInput.classList.add('bg-yellow-50', 'border-blue-500');
            firstInput.focus();
            this.currentIndex = 0;
        }
    }

    // 登録処理
    confirm() {
        if (Array.from(this.inputs).some(input => input.value === '')) {
            alert('すべての項目を測定してください。');
            return;
        }

        // 測定結果を更新（縦/横/高さと数値の1:1対応）
        this.inputs.forEach((input, index) => {
            const label = this.labelsList[index];
            switch (label) {
                case '縦':
                    this.measurementResult.length = input.value;
                    break;
                case '横':
                    this.measurementResult.width = input.value;
                    break;
                case '高さ':
                    this.measurementResult.height = input.value;
                    break;
                default:
                    break;
            }
        });

        const result = Array.from(this.contentCells).map((cell, index) =>
            `${cell.textContent}：${this.inputs[index].value}`
        ).join('\n');

        this.resultContentElement.textContent = result;
        this.resultContainerElement.classList.remove('hidden');

        // 値をクリアせず、そのまま保持する
        const firstInput = this.inputs[0];
        if (firstInput) {
            firstInput.classList.add('bg-yellow-50', 'border-blue-500');
            firstInput.focus();
            this.currentIndex = 0;
        }
    }

    // 更新処理
    async update() {
        this.updateButtonElement.disabled = true;
        this.updateButtonElement.innerHTML = '更新中...';

        const { length, width, height } = this.measurementResult;
        const updateResult = await this.apiService.updateItemPackageSize(this.productIdInputElement.value, this.productIdInputElement.value, { caseLength: length, caseWidth: width, caseHeight: height });
        if (updateResult.error) {
            throw new Error(`Failed to update item package size: ${updateResult.error}`);
        }


        // onUpdateItemPackageSize
        alert("更新しました！");
        console.log(updateResult);

        this.updateButtonElement.disabled = false;
        this.updateButtonElement.innerHTML = '更新';
    }
}

export default MeasureModal;