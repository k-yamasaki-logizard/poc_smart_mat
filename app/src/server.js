// 環境変数を読み込む（最初に読み込む必要がある）
require('dotenv').config();

// 依存モジュール
const path = require('path');
const express = require('express');
const SmartMatApiClient = require('./smart-mat-api-client');
const ZeroApiClient = require('./zero-api-client');

// サーバー設定
const app = express();
const PORT = process.env.PORT || 3000;

// JSONボディパーサー
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルを配信
app.use(express.static(path.join(__dirname, '../static')));

// CORS設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // プリフライトリクエスト（OPTIONS）に対応
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }

    next();
});

// ロギング
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${JSON.stringify({ ...req.body })}`);
    next();
});

// エラー捕捉
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error: ${req.method} ${req.url}`);
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

const apiRouter = express.Router();

// アクセストークンチェック(現状、ACCESS_TOKENとの一致判定のみ)
apiRouter.use((req, res, next) => {
    const token = req.headers['authorization'];
    if (token !== process.env.ACCESS_TOKEN) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
});

// 最新の計測履歴を取得
apiRouter.get('/latestMeasureHistory', async (req, res) => {
    // APIクライアント
    const smartMatApiClient = new SmartMatApiClient(
        process.env.SMART_MAT_API_BASE_URL,
        process.env.SMART_MAT_API_KEY,
        process.env.SMART_MAT_API_DEVICE_ID
    );
    // 最新の計測履歴を取得
    const measureHistory = await smartMatApiClient.fetchLatestMeasureHistory();
    res.json(measureHistory);
});

// 梱包形態(重量)を更新
apiRouter.post('/itemPackageWeight', async (req, res) => {
    const { itemId, caseBarcode, caseWeight } = req.body;

    // APIクライアント
    const zeroApiClient = new ZeroApiClient(process.env.ZERO_API_BASE_URL);

    // ZERO APIログイン
    const authResponse = await zeroApiClient.auth(
        process.env.ZERO_API_APP_KEY,
        process.env.ZERO_API_AUTH_KEY,
        process.env.ZERO_API_OWNER_ID,
        process.env.ZERO_API_AREA_ID
    );

    if (authResponse.ERROR_CODE !== "0") {
        console.error(`Failed to login: ${JSON.stringify(authResponse)}`);
        res.status(401).json({ ERROR_CODE: authResponse.ERROR_CODE, DATA: authResponse.DATA });
        return;
    }

    // 梱包形態(重量)を更新
    const updateResult = await zeroApiClient.updatePackageWeight(itemId, caseBarcode, { caseWeight: caseWeight });
    if (updateResult.ERROR_CODE !== "0") {
        console.error(`Failed to update item package weight: ${JSON.stringify(updateResult)}`);
        res.status(400).json({ ERROR_CODE: updateResult.ERROR_CODE, DATA: updateResult.DATA });
        return;
    }

    res.json(updateResult);
});

// 梱包形態(サイズ)を更新
apiRouter.post('/itemPackageSize', async (req, res) => {
    const { itemId, caseBarcode, caseLength, caseWidth, caseHeight } = req.body;

    // APIクライアント
    const zeroApiClient = new ZeroApiClient(process.env.ZERO_API_BASE_URL);

    // ZERO APIログイン
    const authResponse = await zeroApiClient.auth(
        process.env.ZERO_API_APP_KEY,
        process.env.ZERO_API_AUTH_KEY,
        process.env.ZERO_API_OWNER_ID,
        process.env.ZERO_API_AREA_ID
    );

    if (authResponse.ERROR_CODE !== "0") {
        console.error(`Failed to login: ${JSON.stringify(authResponse)}`);
        res.status(401).json({ ERROR_CODE: authResponse.ERROR_CODE, DATA: authResponse.DATA });
        return;
    }

    // 梱包形態(サイズ)を更新
    const updateResult = await zeroApiClient.updatePackageSize(itemId, caseBarcode, {
        caseLength: caseLength,
        caseWidth: caseWidth,
        caseHeight: caseHeight,
    });

    if (updateResult.ERROR_CODE !== "0") {
        console.error(`Failed to update item package size: ${JSON.stringify(updateResult)}`);
        res.status(400).json({ ERROR_CODE: updateResult.ERROR_CODE, DATA: updateResult.DATA });
        return;
    }

    res.json(updateResult);
});

// サーバー起動
app.use('/api', apiRouter);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

