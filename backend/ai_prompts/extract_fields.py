#!/usr/bin/env python3
"""
脚本用于清理ai_prompts目录下所有以defense_开头的JSON文件中
符合fx_xxx/dx_xxx模式的字段名，将其从fx_xxx格式简化为fx
"""

import os
import re
import json
from pathlib import Path


def clean_fields_in_json(file_path):
    """
    清理JSON文件中的字段名，将fx_xxx格式改为fx格式
    
    Args:
        file_path (str): JSON文件路径
    
    Returns:
        bool: 是否成功修改文件
    """
    try:
        # 读取文件内容
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 备份原文件
        backup_path = file_path.with_suffix('.json.bak')
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 使用正则表达式匹配并替换字段名
        # 匹配模式: "f或d开头，后跟数字和下划线，再跟其他字符"的字段名
        # 保留f或d和数字部分，删除下划线及其后的部分
        pattern = r'"([fd]\d*)_([a-zA-Z0-9_]+)"'
        
        def replace_field_name(match):
            prefix = match.group(1)  # 例如 "d1"
            suffix = match.group(2)  # 例如 "claimAmount"
            # 确保我们不修改defendants_natural和defendants_legal
            full_match = match.group(0)[1:-1]  # 去掉引号
            if full_match in ['defendants_natural', 'defendants_legal']:
                return match.group(0)
            return f'"{prefix}"'
        
        # 执行替换
        modified_content = re.sub(pattern, replace_field_name, content)
        
        # 写入修改后的内容
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(modified_content)
        
        return True
    except Exception as e:
        print(f"处理文件 {file_path.name} 时出错: {e}")
        return False


def process_defense_files(directory_path):
    """
    处理目录下所有以defense_开头的JSON文件
    
    Args:
        directory_path (str): 目录路径
    
    Returns:
        dict: 处理结果统计
    """
    directory = Path(directory_path)
    results = {
        'processed': 0,
        'success': 0,
        'failed': 0
    }
    
    # 查找所有以defense_开头的JSON文件
    for file_path in directory.glob('defense_*.json'):
        results['processed'] += 1
        print(f"正在处理文件: {file_path.name}")
        
        if clean_fields_in_json(file_path):
            results['success'] += 1
            print(f"  成功处理文件 {file_path.name}")
        else:
            results['failed'] += 1
            print(f"  处理文件 {file_path.name} 失败")
    
    return results


def main():
    """主函数"""
    # 获取当前脚本所在目录
    script_dir = Path(__file__).parent
    
    print("开始处理ai_prompts目录下的defense_开头JSON文件...")
    print("注意：原文件将被备份为 .json.bak 文件")
    
    # 处理文件
    results = process_defense_files(script_dir)
    
    # 输出汇总结果
    print("\n=== 处理结果 ===")
    print(f"总共处理文件数: {results['processed']}")
    print(f"成功处理文件数: {results['success']}")
    print(f"处理失败文件数: {results['failed']}")
    print("\n处理完成！原文件已备份为 .json.bak 文件")


if __name__ == "__main__":
    main()