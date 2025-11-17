import ApiService from './scripts/api-service.js';
import ReflectWeightButton from './scripts/reflect-weight-button.js';
import MeasureModal from './scripts/measure-modal.js';

const AppSettings = {
    backendUrl: "/api",
    accessToken: "1234567890",
}

const apiService = new ApiService(AppSettings.backendUrl, AppSettings.accessToken);

// ReflectWeightButton用の要素取得
const reflectBtn = document.getElementById('reflectBtn');
const productIdInput = document.getElementById('productId');
const measureHistoryContainer = document.getElementById('measureHistoryContainer');

// ReflectWeightButtonのインスタンス作成
const reflectWeightButton = new ReflectWeightButton(apiService, reflectBtn, productIdInput, measureHistoryContainer);

// MeasureModal用の要素取得
const measureModalElement = document.getElementById('measureModal');
const openBtnElement = document.getElementById('openMeasureModalBtn');
const closeBtnElement = document.getElementById('closeMeasureModalBtn');
const resultContainerElement = document.getElementById('resultContainerElement');
const resultContentElement = document.getElementById('resultContentElement');
const resetButtonElement = document.getElementById('resetButtonElement');
const confirmButtonElement = document.getElementById('confirmButtonElement');
const updateButtonElement = document.getElementById('updateButtonElement');

// MeasureModalのインスタンス作成
const measureModal = new MeasureModal(apiService, productIdInput, measureModalElement, openBtnElement, closeBtnElement, resultContainerElement, resultContentElement, updateButtonElement);
measureModal.init();

// ReflectWeightButtonのイベントリスナー設定
reflectBtn.addEventListener('click', async () => {
    await reflectWeightButton.click();
});

// MeasureModalのイベントリスナー設定
openBtnElement.addEventListener('click', () => {
    measureModal.open();
});

closeBtnElement.addEventListener('click', () => {
    measureModal.close();
});

resetButtonElement.addEventListener('click', () => {
    measureModal.reset();
});

confirmButtonElement.addEventListener('click', () => {
    measureModal.confirm();
});

updateButtonElement.addEventListener('click', async () => {
    await measureModal.update();
});