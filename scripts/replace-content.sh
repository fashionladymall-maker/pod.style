#!/bin/bash
# Phase 4: Replace content references
# 替换代码文件中的 tiktok → omg

set -e

echo "🔍 Phase 4: Replacing content references..."
echo ""

# 定义要处理的文件类型
extensions=("ts" "tsx" "js" "jsx" "json" "md")

# 排除的路径
exclude_paths=(
  "./node_modules"
  "./.git"
  "./.next"
  "./dist"
  "./.bmad-core"
  "./DEPRECATED_"
)

# 计数器
total_files=0
modified_files=0

# 遍历每种文件类型
for ext in "${extensions[@]}"; do
  echo "Processing *.$ext files..."
  
  # 查找文件
  while IFS= read -r file; do
    # 跳过 DEPRECATED 文件
    if [[ "$file" == *"DEPRECATED_"* ]]; then
      continue
    fi
    
    total_files=$((total_files + 1))
    
    # 检查文件是否包含 tiktok/TikTok
    if grep -qi "tiktok" "$file" 2>/dev/null; then
      echo "  Updating: $file"
      
      # 创建备份
      cp "$file" "$file.bak"
      
      # 执行替换
      sed -i '' \
        -e 's/tiktok-app/omg-app/g' \
        -e 's/TikTokApp/OMGApp/g' \
        -e 's/tiktok-client/omg-client/g' \
        -e 's/TikTokClient/OMGClient/g' \
        -e 's/\/tiktok/\/omg/g' \
        -e 's/@\/components\/tiktok/@\/components\/omg/g' \
        -e 's/@\/app\/tiktok/@\/app\/omg/g' \
        -e 's/components\/tiktok/components\/omg/g' \
        -e 's/app\/tiktok/app\/omg/g' \
        -e 's/TikTok/OMG/g' \
        -e 's/tiktok/omg/g' \
        -e 's/TIKTOK/OMG/g' \
        "$file"
      
      modified_files=$((modified_files + 1))
    fi
  done < <(find . -type f -name "*.$ext" \
    -not -path "./node_modules/*" \
    -not -path "./.git/*" \
    -not -path "./.next/*" \
    -not -path "./dist/*" \
    -not -path "./.bmad-core/*" \
    -not -path "./DEPRECATED_*")
done

echo ""
echo "✅ Phase 4 complete"
echo "   Total files scanned: $total_files"
echo "   Files modified: $modified_files"
echo ""
echo "Backup files created with .bak extension"
echo "To remove backups: find . -name '*.bak' -delete"

