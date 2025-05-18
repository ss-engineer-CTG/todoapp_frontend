import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Template } from '../../types/template';
import { generateId } from '../../utils/taskUtils';

interface TemplatesState {
  templates: Template[];
}

// 初期ステート
const initialState: TemplatesState = {
  templates: []
};

// テンプレートスライス
const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    // テンプレートの作成
    createTemplate: (state, action: PayloadAction<{
      name: string;
      description?: string;
      sourceType: 'selection' | 'project';
      sourceId?: string;
      taskKeys?: string[];
    }>) => {
      const { name, description, sourceType, sourceId, taskKeys } = action.payload;
      
      const newTemplate: Template = {
        id: generateId(),
        name,
        description: description || '',
        sourceType,
        sourceId,
        taskKeys,
        taskCount: taskKeys ? taskKeys.length : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      state.templates.push(newTemplate);
    },
    
    // テンプレートの更新
    updateTemplate: (state, action: PayloadAction<{
      id: string;
      template: Partial<Template>;
    }>) => {
      const { id, template } = action.payload;
      const existingTemplate = state.templates.find(t => t.id === id);
      
      if (existingTemplate) {
        Object.assign(existingTemplate, { 
          ...template,
          updatedAt: new Date().toISOString()
        });
      }
    },
    
    // テンプレートの削除
    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(t => t.id !== action.payload);
    },
    
    // すべてのテンプレートの削除
    clearAllTemplates: (state) => {
      state.templates = [];
    }
  },
});

// アクションエクスポート
export const { 
  createTemplate, 
  updateTemplate, 
  deleteTemplate, 
  clearAllTemplates 
} = templatesSlice.actions;

export default templatesSlice.reducer;