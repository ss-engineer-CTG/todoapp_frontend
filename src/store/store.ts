import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './reducers';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Redux Persistの設定
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['templates'], // projectsを除外し、templatesのみ永続化
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ストアを作成
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Redux Persistのために非シリアライズアクションを許可
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// ストアの型定義
export type AppDispatch = typeof store.dispatch;

// 永続化ストアを作成
export const persistor = persistStore(store);