#!/bin/bash
# OMG Compliance Cleanup Script
# 根据蓝皮书 §0，将所有真实平台名替换为 OMG 代号

set -e

echo "🔧 Starting OMG Compliance Cleanup..."
echo ""

# 1. 重命名目录
echo "📁 Step 1: Renaming directories..."

if [ -d "src/components/tiktok" ]; then
  echo "  Renaming src/components/tiktok → src/components/omg"
  git mv src/components/tiktok src/components/omg || mv src/components/tiktok src/components/omg
fi

if [ -d "src/app/tiktok" ]; then
  echo "  Renaming src/app/tiktok → src/app/omg"
  git mv src/app/tiktok src/app/omg || mv src/app/tiktok src/app/omg
fi

# 2. 重命名文件
echo ""
echo "📄 Step 2: Renaming files..."

if [ -f "src/app/tiktok-client.tsx" ]; then
  echo "  Renaming src/app/tiktok-client.tsx → src/app/omg-client.tsx"
  git mv src/app/tiktok-client.tsx src/app/omg-client.tsx || mv src/app/tiktok-client.tsx src/app/omg-client.tsx
fi

# 重命名文档文件（保留历史记录，添加 DEPRECATED 前缀）
echo ""
echo "📚 Step 3: Archiving legacy documentation..."

for file in TIKTOK_*.md; do
  if [ -f "$file" ]; then
    new_name="DEPRECATED_${file}"
    echo "  Archiving $file → $new_name"
    git mv "$file" "$new_name" 2>/dev/null || mv "$file" "$new_name"
  fi
done

# 3. 替换文件内容中的引用
echo ""
echo "🔍 Step 4: Replacing content references..."

# 定义需要替换的文件类型
file_types=("*.ts" "*.tsx" "*.js" "*.jsx" "*.json" "*.md" "*.yml" "*.yaml")

# 使用 find 和 sed 进行批量替换
for ext in "${file_types[@]}"; do
  find . -type f -name "$ext" \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./.next/*" \
    -not -path "./dist/*" \
    -not -path "./.bmad-core/*" \
    -not -path "./DEPRECATED_*" \
    -exec sed -i.bak \
      -e 's/tiktok/omg/g' \
      -e 's/TikTok/OMG/g' \
      -e 's/TIKTOK/OMG/g' \
      -e 's/Tiktok/Omg/g' \
      {} \; 2>/dev/null || true
done

# 清理备份文件
find . -name "*.bak" -type f -delete 2>/dev/null || true

echo ""
echo "✅ OMG Compliance Cleanup completed!"
echo ""
echo "📋 Next steps:"
echo "  1. Review changes: git status"
echo "  2. Test the application: npm run dev"
echo "  3. Run compliance check: npm run scan:banned"
echo "  4. Commit changes: git add . && git commit -m 'refactor: OMG compliance cleanup'"
echo ""

