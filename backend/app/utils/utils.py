from typing import Any, Dict


def format_final_data_to_text(final_data: Dict[str, Any]) -> str:
    """
    将前端生成的、结构化的 final JSON 对象，转换为一个简洁的、适合AI阅读的纯文本。
    """

    text_parts = []

    # 格式化起诉状的诉讼请求
    claim_items = final_data.get('claimItems')
    if claim_items:
        text_parts.append("【诉讼请求】")
        for item in claim_items:
            question = item.get('question', '').strip()
            answers = item.get('answers', '').strip()
            if answers and answers != '无':  # 只添加有实质内容的项
                # 对于要素式表格，可以用更简洁的方式组合
                if "完整陈述" not in question:
                    text_parts.append(
                        # 将换行替换为空格
                        f"{question}: {answers.replace(chr(10), ' ')}")
                else:
                    text_parts.append(f"{answers}")  # 完整陈述直接输出
        text_parts.append("-" * 20)

    # 格式化答辩状的答辩事项
    defense_items = final_data.get('defenseItems')
    if defense_items:
        text_parts.append("【答辩事项】")
        for item in defense_items:
            question = item.get('question', '').strip()
            answers = item.get('answers', '').strip()
            if answers:
                if "完整表述" not in answers:
                    text_parts.append(
                        f"{question}: {answers.replace(chr(10), ' ')}")
                else:
                    text_parts.append(answers)  # 完整陈述直接输出
        text_parts.append("-" * 20)

    # 4. 动态格式化事实与理由
    # 起诉状用 factItems, 答辩状用 factsAndReasons
    fact_section_title = "【事实与理由】"
    fact_items = final_data.get('factItems')
    if fact_items:
        text_parts.append(fact_section_title)
        for item in fact_items:
            question = item.get('question', '').strip()
            answers = item.get('answers', '').strip()
            if answers and answers != '无':
                if "完整陈述" not in question and "完整表述" not in answers:
                    text_parts.append(
                        f"{question}: {answers.replace(chr(10), ' ')}")
                else:
                    text_parts.append(answers)
        text_parts.append("-" * 20)

    return "\n\n".join(text_parts)