import { Tag, ColorVariant } from '../types'

const TAGS_STORAGE_KEY = 'learning-tags'
const DEFAULT_COLORS: ColorVariant[] = ['blue', 'green', 'purple', 'orange', 'teal', 'rose']

export class TagStorage {
  private static instance: TagStorage
  private tags: Tag[] = []

  private constructor() {
    this.loadTags()
  }

  public static getInstance(): TagStorage {
    if (!TagStorage.instance) {
      TagStorage.instance = new TagStorage()
    }
    return TagStorage.instance
  }

  private loadTags(): void {
    try {
      const stored = localStorage.getItem(TAGS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.tags = parsed.map((tag: any) => ({
          ...tag,
          createdAt: new Date(tag.createdAt)
        }))
      } else {
        // 初回起動時にデフォルトタグを作成
        this.initializeDefaultTags()
      }
    } catch (error) {
      console.error('タグデータの読み込みに失敗しました:', error)
      this.initializeDefaultTags()
    }
  }

  private initializeDefaultTags(): void {
    // デフォルトタグなしで開始
    this.tags = []
    this.saveTags()
  }

  private saveTags(): void {
    try {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(this.tags))
    } catch (error) {
      console.error('タグデータの保存に失敗しました:', error)
    }
  }

  private generateId(): string {
    return `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // タグの取得（使用頻度順）
  public getAllTags(): Tag[] {
    return [...this.tags].sort((a, b) => b.usageCount - a.usageCount)
  }

  // タグの検索
  public searchTags(query: string): Tag[] {
    if (!query.trim()) return this.getAllTags()
    
    const lowerQuery = query.toLowerCase()
    return this.tags
      .filter(tag => tag.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.usageCount - a.usageCount)
  }

  // タグの作成
  public createTag(name: string, emoji?: string): Tag {
    const trimmedName = name.trim()
    if (!trimmedName) {
      throw new Error('タグ名を入力してください')
    }

    // 既存タグとの重複チェック
    const existing = this.tags.find(tag => tag.name.toLowerCase() === trimmedName.toLowerCase())
    if (existing) {
      return existing
    }

    // 新しいタグを作成
    const newTag: Tag = {
      id: this.generateId(),
      name: trimmedName,
      color: this.getNextColor(),
      emoji,
      createdAt: new Date(),
      usageCount: 0
    }

    this.tags.push(newTag)
    this.saveTags()
    
    return newTag
  }

  // タグの使用回数を増やす
  public incrementUsage(tagId: string): void {
    const tag = this.tags.find(t => t.id === tagId)
    if (tag) {
      tag.usageCount++
      this.saveTags()
    }
  }

  // タグIDから名前を取得
  public getTagName(tagId: string): string {
    const tag = this.tags.find(t => t.id === tagId)
    return tag ? tag.name : 'Unknown'
  }

  // タグIDからタグオブジェクトを取得
  public getTag(tagId: string): Tag | undefined {
    return this.tags.find(t => t.id === tagId)
  }

  // 複数タグIDからタグオブジェクトを取得
  public getTags(tagIds: string[]): Tag[] {
    return tagIds.map(id => this.getTag(id)).filter((tag): tag is Tag => tag !== undefined)
  }

  private getNextColor(): ColorVariant {
    const usedColors = this.tags.map(tag => tag.color)
    const availableColors = DEFAULT_COLORS.filter(color => 
      usedColors.filter(used => used === color).length < Math.ceil(this.tags.length / DEFAULT_COLORS.length) + 1
    )
    
    if (availableColors.length > 0) {
      return availableColors[0]
    }
    
    return DEFAULT_COLORS[this.tags.length % DEFAULT_COLORS.length]
  }
}

// シングルトンインスタンスをエクスポート
export const tagStorage = TagStorage.getInstance()