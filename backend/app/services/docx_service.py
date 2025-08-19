from docxtpl import DocxTemplate
from pathlib import Path
from ..schemas.document_schemas import ClaimFinalData, DefenseFinalData
from datetime import datetime
from typing import Union

OUTPUT_BASE_PATH = "outputs"

if not Path(OUTPUT_BASE_PATH).exists():
    Path(OUTPUT_BASE_PATH).mkdir()


def create_docx_from_final_data(final_data: Union[ClaimFinalData, DefenseFinalData], template_name: str, output_path: str = "new_document") -> str:
    """使用 final 数据生成 DOCX 文件"""
    template_path = Path(f"app/templates/{template_name}.docx")
    if not template_path.exists():
        raise FileNotFoundError(f"未找到docx模版文件: {template_path}")

    doc = DocxTemplate(template_path)

    # docxtpl 的 context 就是我们的 final_data 对象
    context = final_data.model_dump()

    today = datetime.now().strftime("%Y-%m-%d")

    if not Path(OUTPUT_BASE_PATH, today).exists():
        Path(OUTPUT_BASE_PATH, today).mkdir()

    output_path_final = Path(OUTPUT_BASE_PATH, today, output_path)
    doc.render(context)
    doc.save(output_path_final)

    return str(output_path_final)

def create_docx_from_context(context: dict, template_name: str, output_path: str = "推荐证据目录") -> str:
    """使用 context 数据生成 DOCX 文件"""
    template_path = Path(f"app/templates/{template_name}.docx")
    if not template_path.exists():
        raise FileNotFoundError(f"未找到docx模版文件: {template_path}")

    doc = DocxTemplate(template_path)

    today = datetime.now().strftime("%Y-%m-%d")

    if not Path(OUTPUT_BASE_PATH, today).exists():
        Path(OUTPUT_BASE_PATH, today).mkdir()

    output_path_final = Path(OUTPUT_BASE_PATH, today, output_path)
    doc.render(context)
    doc.save(output_path_final)

    return str(output_path_final)
