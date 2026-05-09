# 19. プロンプト(charm / palm / match)

> 関連: REQUIREMENTS.md §4.6, §6, §12.5

## 概要

3 モードのプロンプトを定義。「魅力発見モード」(charm)は新規、手相(palm)・相性(match)は Web 版から移植。

## 前提

- [07. Workers ブートストラップ](./07-workers-bootstrap.md)

## TODO

- [ ] `workers/src/prompts.ts` に `PROMPTS = { charm, palm, match }` を定義
- [ ] charm: REQUIREMENTS §6.2.1 の本文をそのまま採用
- [ ] palm: Web 版仕様書(`uranai-kikkake-spec.md`)の手相プロンプトを移植
- [ ] match: Web 版の相性プロンプトを移植、`score` 必須で出力
- [ ] 共通の `RESULT_SCHEMA`(REQUIREMENTS §6.1)も同ファイルにまとめる
- [ ] charm モードの出力が**否定的にならない**ことを 5 サンプル以上で目視確認
- [ ] 過去のテスト用画像で動物例えが「絶滅危惧種」「不気味な動物」等を出さないか確認

## 受入基準

- 3 モードすべてで `RESULT_SCHEMA` に従う JSON が返る
- charm モードの結果が「読んで嬉しくなる」トーンに揃っている
- match モードで `score: 0-100` が必ず含まれる

## 技術メモ

- プロンプトは A/B テストしやすいよう、定数として分離
- 将来的にユーザーの好みでトーン(ガチ/笑い)を切替できる構造を意識(関数化推奨)
