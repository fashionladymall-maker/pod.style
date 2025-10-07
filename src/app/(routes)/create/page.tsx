'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('请输入设计描述');
      return;
    }

    setIsGenerating(true);
    
    try {
      // TODO: 调用 AI 生成 API
      console.log('生成设计:', prompt);
      
      // 模拟生成过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 跳转到预览页面
      router.push('/');
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">创建设计</h1>
        
        <div className="space-y-6">
          {/* Prompt 输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              描述你的设计
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：万圣节骷髅头可爱风格..."
              className="w-full h-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            />
          </div>

          {/* 风格选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              选择风格
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['可爱', '酷炫', '简约', '复古', '未来', '自然'].map((style) => (
                <button
                  key={style}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
                  disabled={isGenerating}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              或上传图片
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              disabled={isGenerating}
            />
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isGenerating ? '生成中...' : '生成设计'}
          </button>
        </div>
      </div>
    </div>
  );
}

