/**
 * ZERO APIクライアントのラッパー
 * 
 * ◆メモ
 * ・AUTH_KEYでのログインを実施して、cookieとしてfuelfidを取得。以後そのfuelfidをcookieとして送信して、ZERO APIを呼び出す。
 * ・実装を簡単にするため、一旦は各APIを呼び出す前に必ずauthを呼ぶことにする
 * 
 * ◆各APIの共通仕様
 * ・エラー時のレスポンス例（全API共通）:
 * {
 *   "ERROR_CODE": "6",
 *   "DATA": {
 *     "ERROR_DETAIL": [
 *       {
 *         "PARAM_NAME": "OWNER_ID",
 *         "ROW": ""
 *       }
 *     ]
 *   }
 * }
 */
class ZeroApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.sessionString = null;
    }

    /**
     * 認証して、fuelfidを取得
     *
     * @param {*} appKey
     * @param {*} authKey
     * @param {*} ownerId
     * @param {*} areaId
     *
     * レスポンスのサンプル:
     * {
     *   "ERROR_CODE": "0",
     *   "DATA": {
     *     "LOGIN_INFO": [
     *       {
     *         "OWNER_ID": "1",
     *         "OWNER_DISP_NAME": "荷主01",
     *         "AREA_ID": "1",
     *         "AREA_DISP_NAME": "倉庫01",
     *         "LANG_ID": "JPN",
     *         "DEBUG_FLG": "0"
     *       }
     *     ]
     *   }
     * }
     */
    async auth(appKey, authKey, ownerId, areaId) {
        const loginResponse = await fetch(`${this.baseUrl}/login/login/keylogin`, {
            method: 'POST',
            body: JSON.stringify({
                APP_KEY: appKey,
                AUTH_KEY: authKey,
                OWNER_ID: ownerId,
                AREA_ID: areaId,
            }),
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.statusText}`);
        }

        // Set-CookieヘッダーからCookieを取得
        const cookies = loginResponse.headers.get('set-cookie').split('; ');
        const fuelfid = cookies.filter(cookie => cookie.includes('fuelfid='))
            .map(cookie => cookie.match(/^.*(fuelfid=.*)$/)[1])
            .find(cookie => cookie !== 'fuelfid=deleted');
        this.sessionString = fuelfid;
        return await loginResponse.json();
    }

    async updateWeight(itemId, barcode, weight) {
        const importResponse = await fetch(`${this.baseUrl}/common/import/import`, {
            method: 'POST',
            body: JSON.stringify({
                OWNER_ID: process.env.ZERO_API_OWNER_ID,
                AREA_ID: process.env.ZERO_API_AREA_ID,
                ONLY_AREA_IMPORT_FLG: "1",
                FILE_ID: "2115", // 商品マスタ(梱包形態)2
                PTRN_ID: "0", // スマートマット検証用パターン
                ERROR_DETAIL: "1",
                IMPORT_DATA: [
                    '"商品ID","ケースバーコード","ケース_重量（SKU単位）"',
                    `"${itemId}","${barcode}","${weight}"`,
                ]
            }),
            headers: {
                'Content-Type': 'application/json',
                'Cookie': this.sessionString
            }
        });

        if (!importResponse.ok) {
            throw new Error(`Update weight failed: ${importResponse.statusText}`);
        }
        return await importResponse.json();
    }
}

module.exports = ZeroApiClient;

