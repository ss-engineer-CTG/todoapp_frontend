// テスト用スクリプト：Daily Focus フックのデータ確認
// ブラウザコンソールで実行して動作確認

// ローカルストレージから直接データを確認
function checkLocalStorageData() {
  console.log('=== Daily Focus データ確認 ===');
  
  // 目標データの確認
  const goalsData = localStorage.getItem('daily-focus-goals');
  console.log('Goals data:', goalsData ? JSON.parse(goalsData) : 'No data found');
  
  // カスタムタグデータの確認
  const tagsData = localStorage.getItem('daily-focus-custom-tags');
  console.log('Custom tags data:', tagsData ? JSON.parse(tagsData) : 'No data found');
  
  // ToDoデータの確認
  const todosData = localStorage.getItem('daily-focus-todos');
  console.log('Todos data:', todosData ? JSON.parse(todosData) : 'No data found');
  
  // セッションデータの確認
  const sessionsData = localStorage.getItem('daily-focus-sessions');
  console.log('Sessions data:', sessionsData ? JSON.parse(sessionsData) : 'No data found');
  
  // 日次統計データの確認
  const statsData = localStorage.getItem('daily-focus-daily-stats');
  console.log('Daily stats data:', statsData ? JSON.parse(statsData) : 'No data found');
}

// デフォルトデータを手動で設定
function initializeDefaultData() {
  console.log('=== デフォルトデータを設定中 ===');
  
  // デフォルト目標
  const defaultGoals = [
    {
      id: 'goal-1',
      title: 'プログラミングスキル向上',
      description: 'React + TypeScriptを使った実践的なアプリケーション開発をマスターする',
      color: 'blue',
      category: 'programming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false
    },
    {
      id: 'goal-2',
      title: '英語学習',
      description: 'TOEIC 800点を目指して毎日30分の学習を継続する',
      color: 'green',
      category: 'english',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false
    },
    {
      id: 'goal-3',
      title: '健康管理',
      description: '週3回の運動習慣を身につけて体力向上を図る',
      color: 'purple',
      category: 'health',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false
    }
  ];
  
  // デフォルトカスタムタグ
  const defaultTags = [
    {
      id: 'tag-1',
      name: '読書',
      emoji: '📚',
      color: 'orange',
      category: 'reading',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tag-2',
      name: '家事',
      emoji: '🏠',
      color: 'teal',
      category: 'other',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'tag-3',
      name: '趣味',
      emoji: '🎨',
      color: 'rose',
      category: 'other',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // ローカルストレージに保存
  localStorage.setItem('daily-focus-goals', JSON.stringify(defaultGoals, null, 2));
  localStorage.setItem('daily-focus-custom-tags', JSON.stringify(defaultTags, null, 2));
  localStorage.setItem('daily-focus-todos', JSON.stringify([]));
  localStorage.setItem('daily-focus-sessions', JSON.stringify([]));
  localStorage.setItem('daily-focus-daily-stats', JSON.stringify([]));
  
  console.log('デフォルトデータを設定しました');
}

// データをクリア
function clearAllData() {
  console.log('=== 全データをクリア中 ===');
  const keys = [
    'daily-focus-goals',
    'daily-focus-custom-tags',
    'daily-focus-todos',
    'daily-focus-sessions',
    'daily-focus-daily-stats',
    'daily-focus-learning-memo',
    'daily-focus-panel-dimensions',
    'daily-focus-current-session'
  ];
  
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('全データをクリアしました');
}

// 使用方法
console.log('=== Daily Focus データテストツール ===');
console.log('1. checkLocalStorageData() - 現在のデータを確認');
console.log('2. initializeDefaultData() - デフォルトデータを設定');
console.log('3. clearAllData() - 全データをクリア');

// 初回実行時にデータ確認
checkLocalStorageData();