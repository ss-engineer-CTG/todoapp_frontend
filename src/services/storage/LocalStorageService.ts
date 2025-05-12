// ローカルストレージアクセスをラップするサービス

export class LocalStorageService {
    // 指定されたキーのデータを取得
    static getData(key: string): any {
      try {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : null
      } catch (error) {
        console.error(`Error getting data from localStorage with key ${key}:`, error)
        return null
      }
    }
  
    // 指定されたキーにデータを保存
    static saveData(key: string, data: any): boolean {
      try {
        localStorage.setItem(key, JSON.stringify(data))
        return true
      } catch (error) {
        console.error(`Error saving data to localStorage with key ${key}:`, error)
        return false
      }
    }
  
    // 指定されたキーのデータを削除
    static removeData(key: string): boolean {
      try {
        localStorage.removeItem(key)
        return true
      } catch (error) {
        console.error(`Error removing data from localStorage with key ${key}:`, error)
        return false
      }
    }
  
    // ローカルストレージの全データをクリア
    static clearAll(): boolean {
      try {
        localStorage.clear()
        return true
      } catch (error) {
        console.error('Error clearing localStorage:', error)
        return false
      }
    }
  }