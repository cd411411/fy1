from docxtpl import DocxTemplate
from pathlib import Path
from ..schemas.document_schemas import ClaimFinalData, DefenseFinalData
from datetime import datetime, timezone
from typing import Union

OUTPUT_BASE_PATH = "outputs"

if not Path(OUTPUT_BASE_PATH).exists():
    Path(OUTPUT_BASE_PATH).mkdir()


def create_docx_from_final_data(final_data: Union[ClaimFinalData, DefenseFinalData], template_name: str, output_path: str = "new_document") -> str:
    """
    使用 final 数据生成 DOCX 文件
    
    该函数使用 docxtpl 模板引擎，将传入的 final_data 数据渲染到指定的 DOCX 模板中，
    生成一个新的 DOCX 文档。输出文件按日期组织在目录结构中。

    Args:
        final_data (Union[ClaimFinalData, DefenseFinalData]): 包含文档内容数据的 Pydantic 模型实例，
            支持起诉状数据或答辩状数据
        template_name (str): 模板文件名（不含扩展名），模板文件应位于 app/templates/ 目录下
        output_path (str, optional): 输出文件名（不含路径），默认为 "new_document"，
            文件将保存在 outputs/YYYY-MM-DD/ 目录下

    Returns:
        str: 生成的 DOCX 文件的完整路径

    Raises:
        FileNotFoundError: 当指定的模板文件不存在时抛出异常

    Example:
        >>> data = ClaimFinalData(...)
        >>> file_path = create_docx_from_final_data(data, "claim_template", "my_claim.docx")
        >>> print(f"文档已生成: {file_path}")
    """
    template_path = Path(f"app/templates/{template_name}.docx")
    if not template_path.exists():
        raise FileNotFoundError(f"未找到docx模版文件: {template_path}")

    doc = DocxTemplate(template_path)

    # docxtpl 的 context 就是我们的 final_data 对象
    context = final_data.model_dump()

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if not Path(OUTPUT_BASE_PATH, today).exists():
        Path(OUTPUT_BASE_PATH, today).mkdir()

    output_path_final = Path(OUTPUT_BASE_PATH, today, output_path)
    doc.render(context)
    doc.save(output_path_final)

    return str(output_path_final)

def create_docx_from_context(context: dict, template_name: str, output_path: str = f"新生成的文档-{datetime.now(timezone.utc)}") -> str:
    """
    使用 context 数据生成 DOCX 文件
    
    该函数使用 docxtpl 模板引擎，将传入的 context 字典数据渲染到指定的 DOCX 模板中，
    生成一个新的 DOCX 文档。输出文件按日期组织在目录结构中。

    Args:
        context (dict): 包含文档内容数据的字典，键值对将直接用于模板渲染
        template_name (str): 模板文件名（不含扩展名），模板文件应位于 app/templates/ 目录下
        output_path (str, optional): 输出文件名（不含路径），默认为包含当前UTC时间的中文文件名，
            文件将保存在 outputs/YYYY-MM-DD/ 目录下

    Returns:
        str: 生成的 DOCX 文件的完整路径

    Raises:
        FileNotFoundError: 当指定的模板文件不存在时抛出异常

    Example:
        >>> context = {"party_name": "张三", "amount": 10000}
        >>> file_path = create_docx_from_context(context, "contract_template", "contract.docx")
        >>> print(f"文档已生成: {file_path}")
    """
    template_path = Path(f"app/templates/{template_name}.docx")
    if not template_path.exists():
        raise FileNotFoundError(f"未找到docx模版文件: {template_path}")

    doc = DocxTemplate(template_path)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if not Path(OUTPUT_BASE_PATH, today).exists():
        Path(OUTPUT_BASE_PATH, today).mkdir()

    output_path_final = Path(OUTPUT_BASE_PATH, today, output_path)
    doc.render(context)
    doc.save(output_path_final)

    return str(output_path_final)