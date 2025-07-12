// システムプロンプト準拠：メインアプリエントリーポイント（リファクタリング：軽量化版）
// リファクタリング対象：769行の巨大ファイルをContainer/Layout パターンで分離

import React from 'react'
import { AppContainer } from './containers/AppContainer'

const TodoApp: React.FC = () => {
  return <AppContainer />
}

export default TodoApp