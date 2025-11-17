# 週末お出かけプランナー (Family Weekend Outing Planner)

家族で楽しめる週末のお出かけプランを提案するAI搭載Webアプリケーション

## 概要

Google Vertex AI（Gemini）とGoogle Maps groundingを活用し、対話型AIインターフェースで家族向けのお出かけプランを提案します。現在地、移動時間、交通手段、子供の年齢などを考慮して、実在する場所のみを提案し、最適なルートとスケジュールを生成します。

### 主な特徴

- **対話型プランニング**: 段階的な質問で希望を明確化
- **AI駆動の提案**: LLMが家族のニーズと好みを理解
- **実世界の正確性**: Google Maps groundingにより実在する場所のみを提案
- **パーソナライズ**: 位置情報、時間制約、交通手段を考慮
- **詳細な旅程**: 目的地、食事スポット、1日のスケジュールを提供
- **反復的な改善**: 生成されたプランの修正リクエストが可能

## 技術スタック

### バックエンド
- **Python 3.11+** - 型ヒント付き
- **FastAPI** - 非同期Webフレームワーク
- **Google Vertex AI** - Gemini 1.5 Pro with Google Maps grounding
- **Google Maps Platform APIs** - Geocoding, Places, Directions
- **Pydantic v2** - 設定とバリデーション
- **uv** - パッケージマネージャー

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Vite** - ビルドツール
- **Tailwind CSS** - スタイリング
- **@googlemaps/js-api-loader** - Maps統合

## セットアップ

### 前提条件

- Python 3.11以上
- Node.js 18以上
- Google Cloud Platform アカウント
- Google Maps API キー（フロントエンド用・バックエンド用の2つ）

### バックエンドセットアップ

```bash
cd backend

# 依存関係のインストール
uv pip install -e ".[dev]"

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して以下を設定:
# - GOOGLE_CLOUD_PROJECT_ID
# - GOOGLE_CLOUD_LOCATION
# - GOOGLE_APPLICATION_CREDENTIALS (サービスアカウントキーのパス)
# - GOOGLE_MAPS_API_KEY

# 開発サーバーの起動
python run.py
```

バックエンドは http://localhost:8000 で起動します。

### フロントエンドセットアップ

```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して以下を設定:
# - VITE_BACKEND_URL=http://localhost:8000
# - VITE_GOOGLE_MAPS_API_KEY

# 開発サーバーの起動
npm run dev
```

フロントエンドは http://localhost:5173 で起動します。

## Google Cloud Platform 設定

### 必要なAPIの有効化

以下のAPIをGCPプロジェクトで有効化してください：

- Vertex AI API
- Maps JavaScript API
- Geocoding API
- Places API
- Directions API
- Distance Matrix API

### サービスアカウント

Vertex AI APIにアクセスするためのサービスアカウントを作成し、JSONキーをダウンロードして `backend/config/service-account-key.json` に配置してください。

詳細は [GCP_SETUP_GUIDE.md](./GCP_SETUP_GUIDE.md) を参照してください。

## 開発

### テストの実行

```bash
# バックエンド
cd backend
pytest

# 特定のテストファイル
pytest tests/test_main.py

# 詳細出力
pytest -v
```

テストポリシーについては [TESTING_POLICY.md](./TESTING_POLICY.md) を参照してください。

### コード品質

```bash
# バックエンド
cd backend
mypy app              # 型チェック
ruff check app        # リント
ruff check --fix app  # 自動修正
black app             # フォーマット

# フロントエンド
cd frontend
npm run lint          # ESLint
```

## プロジェクト構成

```
.
├── backend/              # FastAPI バックエンド
│   ├── app/
│   │   ├── routes/      # APIエンドポイント
│   │   ├── services/    # ビジネスロジック
│   │   ├── models/      # データモデル
│   │   └── config.py    # 設定管理
│   └── tests/           # テスト
│
├── frontend/            # React フロントエンド
│   ├── src/
│   │   ├── components/  # Reactコンポーネント
│   │   ├── hooks/       # カスタムフック
│   │   ├── services/    # API通信
│   │   └── types/       # TypeScript型定義
│   └── public/
│
└── docs/                # ドキュメント
```

## 会話フロー

アプリケーションは以下の状態で会話を管理します：

1. **INITIAL** - ユーザーの最初のリクエスト
2. **GATHERING_PREFERENCES** - 詳細質問（活動タイプ、食事、子供の年齢など）
3. **GENERATING_PLAN** - Vertex AIでMaps groundingを使用してプラン生成
4. **PRESENTING_PLAN** - マップ、スケジュール、目的地の表示
5. **REFINING** - ユーザーによる変更リクエスト
6. **COMPLETED** - 最終確認

## 主要機能

### LLMベースの情報不足判定

単純なチェックリスト方式ではなく、LLMがユーザーメッセージと抽出済み情報を分析し、良いプランを作るために何が必要かを判断します。

### リッチプレイス表示

チャットメッセージ内にインラインでおすすめスポットを表示：
- サムネイル写真
- 評価とレビュー数
- 住所
- クリックで詳細表示

### インタラクティブマップ

- マーカー表示
- ルート表示（実際の道路に沿った）
- クリック可能なマーカー

### プレイス詳細ドロワー

- 営業時間
- 写真ギャラリー
- レビュー
- Google Mapsへのナビゲーション

## ドキュメント

- [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md) - 完全なプロジェクト仕様
- [GCP_SETUP_GUIDE.md](./GCP_SETUP_GUIDE.md) - GCP設定ガイド
- [TESTING_POLICY.md](./TESTING_POLICY.md) - テストガイドライン
- [DESIGN_GUIDELINE.md](./DESIGN_GUIDELINE.md) - デザインシステム
- [CLAUDE.md](./CLAUDE.md) - Claude Code向けガイド

## ライセンス

このプロジェクトは技術検証用のデモアプリケーションです。

## 貢献

このプロジェクトはGoogle Maps groundingの技術検証を目的としています。
