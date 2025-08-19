# app/database.py

import asyncio
import os
from re import X
import secrets
import string
import orjson as json
from datetime import date, datetime, timedelta, timezone
from typing import Dict, Any, Optional, List, AsyncGenerator
from typing import Literal
from sqlalchemy import (
    Column,
    Float,
    Integer,
    String,
    Text,
    TIMESTAMP,
    ForeignKey,
    Boolean,
    UniqueConstraint,
    func,
    or_,
    select,
    update,
    delete,
    extract,
)
from sqlalchemy.orm import declarative_base, relationship, Mapped, mapped_column
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.utils.utils import format_final_data_to_text

from .config.config import settings
import random
from sqlalchemy.orm import selectinload

ModelType = Literal["general", "vision", "fast"]


# --- SQLAlchemy Setup ---
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()

# --- ORM Models ---


def generate_verification_code():
    # 排除易混淆字符
    uppercase_letters = "".join(c for c in string.ascii_uppercase if c not in "OIL")
    lowercase_letters = "".join(c for c in string.ascii_lowercase if c not in "oil")
    digits = "".join(c for c in string.digits if c not in "0")
    letters = uppercase_letters + lowercase_letters
    code_letters = random.sample(letters, 2)
    code_digits = random.sample(digits, 4)
    code = code_letters + code_digits
    random.shuffle(code)
    return "".join(code)


class Case(Base):
    __tablename__ = "cases"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    case_number: Mapped[Optional[str]] = mapped_column(
        String, unique=True, index=True, nullable=True
    )
    case_cause: Mapped[str] = mapped_column(String, index=True, nullable=False)
    plaintiff_code: Mapped[str] = mapped_column(
        String, nullable=False, default=generate_verification_code
    )
    documents = relationship(
        "Document", back_populates="case", cascade="all, delete-orphan"
    )
    defendants = relationship(
        "Defendant", back_populates="case", cascade="all, delete-orphan"
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    documents = relationship(
        "Document", back_populates="case", cascade="all, delete-orphan"
    )


class Defendant(Base):
    __tablename__ = "defendants"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cases.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False, comment="被告姓名或名称")
    verification_code: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, default=generate_verification_code
    )

    case = relationship("Case", back_populates="defendants")
    documents = relationship("Document", back_populates="author_defendant")  # 答辩状


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    case_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cases.id"), nullable=False
    )
    author_defendant_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("defendants.id"), nullable=True
    )
    document_type: Mapped[str] = mapped_column(String, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    is_latest: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    form_data: Mapped[str] = mapped_column(Text, nullable=False)
    final_data: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, default=lambda: datetime.now(timezone.utc)
    )

    case = relationship("Case", back_populates="documents")
    author_defendant = relationship("Defendant", back_populates="documents")
    __table_args__ = (
        UniqueConstraint(
            "case_id",
            "document_type",
            "version",
            "author_defendant_id",
            name="_case_doc_version_uc",
        ),
    )


class AIModel(Base):
    __tablename__ = "ai_models"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    model_name: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, comment="例如: deepseek-chat"
    )
    api_key: Mapped[str] = mapped_column(String, nullable=False)
    base_url: Mapped[str] = mapped_column(String, nullable=False)
    capabilities: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="['general']",
        comment="模型能力, JSON数组: ['general', 'vision', 'fast']",
    )
    temperature: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="温度 (0-2)"
    )
    top_p: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True, comment="Top-P (0-1)"
    )
    max_tokens: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="Max Tokens"
    )
    is_active_general: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active_vision: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_active_fast: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(
        String, default="admin", nullable=False
    )  # 为未来多角色做准备
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


# (新增) 获取用户的CRUD函数
async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()


# --- Dependency for FastAPI ---


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


# --- CRUD Functions ---


async def find_or_create_case(
    db: AsyncSession, case_number: Optional[str], case_cause: str, form_data: dict
) -> Case:
    """
    根据案号查找或创建案件。
    如果是新案件，则根据 form_data 中的被告列表，自动创建关联的 Defendant 记录。
    """
    case: Optional[Case] = None
    if case_number and case_number.strip():
        result = await db.execute(select(Case).where(Case.case_number == case_number))
        case = result.scalars().first()

    if case is None:
        case = Case(case_number=case_number, case_cause=case_cause)
        db.add(case)
        await db.flush()  # (重要) 先 flush 以获取 case.id

        defendant_names = set()  # 使用 set 避免重复
        for p_nat in form_data.get("defendants_natural", []):
            if p_nat.get("name"):
                defendant_names.add(p_nat["name"])
        for p_leg in form_data.get("defendants_legal", []):
            if p_leg.get("entityName"):
                defendant_names.add(p_leg["entityName"])

        if not defendant_names:  # 如果没有被告，也至少创建一个，以防万一
            defendant_names.add("未指定被告")

        for name in defendant_names:
            defendant_obj = Defendant(case_id=case.id, name=name)
            db.add(defendant_obj)

        await db.commit()
        await db.refresh(case)

    return case


async def get_defendant_by_code(
    db: AsyncSession, verification_code: str
) -> Optional[Defendant]:
    """通过被告的唯一验证码查找被告实体，并预加载关联的案件信息"""
    stmt = (
        select(Defendant)
        .options(selectinload(Defendant.case))
        .where(Defendant.verification_code == verification_code)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def save_new_document_version(
    db: AsyncSession,
    case_id: int,
    doc_type: str,
    form_data: dict,
    final_data: dict,
    defendant_id: Optional[int] = None,  # (新增) 答辩状的作者ID
):
    """保存一个新版本的文书"""
    # 1. 将旧版本标记为非最新
    update_stmt = update(Document).where(
        Document.case_id == case_id, Document.document_type == doc_type
    )
    # 如果是答辩状，只将这个特定被告的旧版本设为非最新
    if doc_type == "答辩状" and defendant_id:
        update_stmt = update_stmt.where(Document.author_defendant_id == defendant_id)

    await db.execute(update_stmt.values(is_latest=False))

    # 2. 获取新版本号
    version_stmt = select(func.max(Document.version)).where(
        Document.case_id == case_id, Document.document_type == doc_type
    )
    if doc_type == "答辩状" and defendant_id:
        version_stmt = version_stmt.where(Document.author_defendant_id == defendant_id)

    max_version = (await db.execute(version_stmt)).scalar_one_or_none() or 0
    new_version = max_version + 1

    # 3. 插入新版本
    new_doc = Document(
        case_id=case_id,
        author_defendant_id=defendant_id,
        document_type=doc_type,
        version=new_version,
        form_data=json.dumps(form_data).decode("utf-8"),
        final_data=json.dumps(final_data).decode("utf-8"),
        is_latest=True,
    )
    db.add(new_doc)
    await db.commit()


async def load_document_data_by_code(
    db: AsyncSession, case_number: str, verification_code: str
) -> Optional[Dict[str, Any]]:
    """根据案号和任意验证码加载文书数据"""
    # 1. 尝试作为原告码
    case_plaintiff = await get_case_by_number_and_plaintiff_code(
        db, case_number, verification_code
    )
    if case_plaintiff:
        doc = await get_latest_document_by_case_id(db, case_plaintiff.id, "起诉状")
        if doc:
            return {
                "formData": json.loads(doc.form_data),
                "doc_type": "起诉状",
                "case_cause": case_plaintiff.case_cause,
            }

    # 2. 尝试作为被告码
    defendant_obj = await get_defendant_by_code(db, verification_code)
    if defendant_obj and defendant_obj.case.case_number == case_number:
        doc = await get_latest_document_by_defendant_id(db, defendant_obj.id, "答辩状")
        # 即使被告是第一次填写（doc is None），也要返回基本信息
        return {
            "formData": (
                json.loads(doc.form_data)
                if doc
                else {
                    "basicInfo": {
                        "caseNumber": case_number,
                        "caseCause": defendant_obj.case.case_cause,
                    },
                    # (重要) 把自己的信息预填进去
                    "defendants_natural": [{"name": defendant_obj.name}],
                }
            ),
            "doc_type": "答辩状",
            "case_cause": defendant_obj.case.case_cause,
        }

    return None


async def get_latest_document_by_defendant_id(
    db: AsyncSession, defendant_id: int, doc_type: str
) -> Optional[Document]:
    """获取指定被告的最新文书"""
    stmt = (
        select(Document)
        .where(
            Document.author_defendant_id == defendant_id,
            Document.document_type == doc_type,
            Document.is_latest == True,
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_document_for_editing(
    db: AsyncSession, case_number: str, verification_code: str
) -> Optional[Dict[str, Any]]:
    # 尝试作为原告验证码查询
    stmt_plaintiff = (
        select(Document, Case.case_cause)
        .join(Case)
        .where(
            Case.case_number == case_number,
            Case.plaintiff_code == verification_code,
            Document.document_type == "起诉状",
            Document.is_latest == True,
        )
    )
    result = await db.execute(stmt_plaintiff)
    doc_cause_tuple = result.first()
    if doc_cause_tuple:
        doc, case_cause = doc_cause_tuple
        return {
            "formData": json.loads(doc.form_data),
            "doc_type": "起诉状",
            "case_cause": case_cause,
        }

    # 尝试作为被告验证码查询
    stmt_defendant = (
        select(Document, Case.case_cause)
        .join(Case)
        .where(
            Case.case_number == case_number,
            Case.defendant_code == verification_code,
            Document.document_type == "答辩状",
            Document.is_latest == True,
        )
    )
    result = await db.execute(stmt_defendant)
    doc_cause_tuple = result.first()
    if doc_cause_tuple:
        doc, case_cause = doc_cause_tuple
        return {
            "formData": json.loads(doc.form_data),
            "doc_type": "答辩状",
            "case_cause": case_cause,
        }

    # 如果都没有找到，或者某个角色还没提交过文书，则返回None
    return None


async def get_active_ai_model(
    db: AsyncSession, model_type: ModelType
) -> Optional[AIModel]:
    """根据指定的能力类型获取激活的模型"""
    column_map = {
        "general": AIModel.is_active_general,
        "vision": AIModel.is_active_vision,
        "fast": AIModel.is_active_fast,
    }

    # 确保 model_type 是合法的
    if model_type not in column_map:
        raise ValueError(f"未知的模型类型: {model_type}")

    target_column = column_map[model_type]

    stmt = select(AIModel).where(target_column == True).limit(1)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_cases(
    db: AsyncSession,
    search_term: Optional[str] = None,
    case_cause: Optional[str] = None,
) -> List[Dict[str, Any]]:
    # === 核心修复点: 使用 .desc() 方法以兼容 SQLite 和 PostgreSQL ===
    stmt = select(Case).order_by(Case.updated_at.desc())
    if case_cause:
        stmt = stmt.where(Case.case_cause == case_cause)

    if search_term:
        search_like = f"%{search_term}%"

        # --- START: 核心修改 - 增加 EXISTS 子查询来搜索当事人 ---

        # 子查询：查找是否存在一个 document，其 form_data 包含搜索词
        # 我们搜索 plaintiffs_natural, plaintiffs_legal, defendants_natural, defendants_legal
        subquery = (
            select(Document.id)
            .where(
                Document.case_id == Case.id,  # 关联主查询的case
                or_(
                    # SQLite 和 PostgreSQL 都支持 json_extract，但 LIKE 对 JSON 字段可能效率不高
                    # 对于SQLite，直接用字符串LIKE匹配JSON文本
                    Document.form_data.like(
                        f'%"{search_term}"%'
                    ),  # 这是一个简化的全局JSON搜索
                    # (可选，更精确但更复杂) 如果需要更精确的匹配 "name" 或 "entityName"
                    # Document.form_data.like(f'%name":"%{search_term}%"'),
                    # Document.form_data.like(f'%entityName":"%{search_term}%"')
                ),
            )
            .exists()
        )

        # 将所有搜索条件用 or_ 组合起来
        stmt = stmt.where(
            or_(
                Case.case_number.like(search_like),
                Case.case_cause.like(search_like),
                subquery,  # 将子查询作为条件
            )
        )

    result = await db.execute(stmt)
    cases_orm = result.scalars().all()

    cases_list = []
    for case in cases_orm:
        doc_stmt = (
            select(Document)
            .where(Document.case_id == case.id, Document.document_type == "起诉状")
            .order_by(Document.version.desc())
            .limit(1)
        )
        doc_res = await db.execute(doc_stmt)
        latest_claim_doc = doc_res.scalars().first()

        plaintiff, defendant = "未知", "未知"
        if latest_claim_doc and latest_claim_doc.form_data:
            try:
                form_data: dict = json.loads(str(latest_claim_doc.form_data))
                plaintiff_list = (
                    form_data.get("plaintiffs_natural")
                    or form_data.get("plaintiffs_legal")
                    or []
                )
                if plaintiff_list:
                    plaintiff = (
                        plaintiff_list[0].get("name")
                        or plaintiff_list[0].get("entityName")
                        or "未知"
                    )

                defendant_list = (
                    form_data.get("defendants_natural")
                    or form_data.get("defendants_legal")
                    or []
                )
                if defendant_list:
                    defendant = (
                        defendant_list[0].get("name")
                        or defendant_list[0].get("entityName")
                        or "未知"
                    )
            except Exception:
                # 如果JSON解析失败，使用默认值
                plaintiff, defendant = "未知", "未知"

        count_stmt = select(func.count(Document.id)).where(Document.case_id == case.id)
        doc_count_res = await db.execute(count_stmt)
        doc_count = doc_count_res.scalar_one()

        cases_list.append(
            {
                "id": case.id,
                "case_number": case.case_number,
                "case_cause": case.case_cause,
                "created_at": case.created_at.isoformat(),
                "updated_at": case.updated_at.isoformat(),
                "document_count": doc_count,
                "plaintiff": plaintiff,
                "defendant": defendant,
                "status": "进行中",
            }
        )
    return cases_list


async def get_documents_by_case_number(
    db: AsyncSession, case_number: str
) -> Dict[str, Any]:
    """
    获取指定案号下的案件信息、所有文书以及所有被告信息。
    """
    # 1. 获取案件和关联的被告
    stmt = (
        select(Case)
        .options(selectinload(Case.defendants))
        .where(Case.case_number == case_number)
    )
    result = await db.execute(stmt)
    case = result.scalars().first()

    if not case:
        return {}  # 或者可以抛出404

    # 2. 获取该案件的所有文书
    doc_stmt = (
        select(Document)
        .where(Document.case_id == case.id)
        .order_by(Document.document_type, Document.version.desc())
    )
    doc_result = await db.execute(doc_stmt)
    docs_orm = doc_result.scalars().all()

    documents = []
    for doc in docs_orm:
        documents.append(
            {
                "id": doc.id,
                "case_id": doc.case_id,
                "document_type": doc.document_type,
                "version": doc.version,
                "is_latest": doc.is_latest,
                "form_data": json.loads(str(doc.form_data)),
                "final_data": json.loads(str(doc.final_data)),
                "created_at": doc.created_at.isoformat(),
            }
        )

    # 3. 构造最终返回的数据结构
    response_data = {
        "case_info": {
            "id": case.id,
            "case_number": case.case_number,
            "case_cause": case.case_cause,
            "plaintiff_code": case.plaintiff_code,
        },
        "defendants": [
            {"id": d.id, "name": d.name, "verification_code": d.verification_code}
            for d in case.defendants
        ],
        "documents": documents,
    }

    return response_data


# --- AI Model Management Functions---


async def get_ai_models(db: AsyncSession) -> List[AIModel]:
    result = await db.execute(select(AIModel).order_by(AIModel.id))
    return list(result.scalars().all())


async def add_ai_model(db: AsyncSession, model_data: dict) -> AIModel:
    # 从 model_data 中提取 capabilities 列表
    capabilities_list = model_data.get("capabilities", [])
    # 将其转换为JSON字符串存入数据库
    model_data["capabilities"] = json.dumps(capabilities_list).decode("utf-8")

    new_model = AIModel(**model_data)
    db.add(new_model)
    await db.commit()
    await db.refresh(new_model)
    return new_model


async def delete_ai_model(db: AsyncSession, model_id: int) -> bool:
    model_to_delete = await db.get(AIModel, model_id)
    # 检查模型是否处于任何激活状态
    if model_to_delete and (
        model_to_delete.is_active_general
        or model_to_delete.is_active_vision
        or model_to_delete.is_active_fast
    ):
        raise ValueError(
            "无法删除处于激活状态的模型。请先激活另一个模型或取消其所有激活状态。"
        )

    result = await db.execute(delete(AIModel).where(AIModel.id == model_id))
    await db.commit()
    return result.rowcount > 0


async def set_active_ai_model(
    db: AsyncSession, model_id: int, model_type: ModelType
) -> bool:
    """设置指定ID的AI模型为特定类型的激活模型"""
    column_map = {
        "general": AIModel.is_active_general,
        "vision": AIModel.is_active_vision,
        "fast": AIModel.is_active_fast,
    }
    if model_type not in column_map:
        raise ValueError(f"未知的模型类型: {model_type}")

    target_column = column_map[model_type]

    model_to_activate = await db.get(AIModel, model_id)
    if not model_to_activate:
        return False  # 模型不存在

    # 检查模型是否具备该能力
    model_capabilities = json.loads(model_to_activate.capabilities)
    if model_type not in model_capabilities:
        raise ValueError(f"该模型不支持 '{model_type}' 能力，无法激活。")

    async with db.begin_nested():
        # 1. 将该类型的所有模型的激活状态设为 False
        await db.execute(update(AIModel).values({target_column.name: False}))
        # 2. 将指定ID的模型设置为激活
        result = await db.execute(
            update(AIModel)
            .where(AIModel.id == model_id)
            .values({target_column.name: True})
        )
    await db.commit()
    return result.rowcount > 0


async def get_case_by_number_and_plaintiff_code(
    db: AsyncSession, case_number: str, code: str
) -> Optional[Case]:
    """根据案号和原告验证码查找案件"""
    stmt = select(Case).where(
        Case.case_number == case_number, Case.plaintiff_code == code
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_case_by_number_and_code(
    db: AsyncSession,
    case_number: str,
    code: str,
    role: Literal["plaintiff", "defendant"],
) -> Optional[Case]:
    """根据案号和指定角色的验证码查找案件"""
    if role == "plaintiff":
        stmt = select(Case).where(
            Case.case_number == case_number, Case.plaintiff_code == code
        )
    else:  # role == "defendant"
        stmt = select(Case).where(
            Case.case_number == case_number, Case.defendant_code == code
        )

    result = await db.execute(stmt)
    return result.scalars().first()


async def get_latest_document_by_case_id(
    db: AsyncSession, case_id: int, doc_type: str
) -> Optional[Document]:
    """根据 case_id 和文书类型获取最新的文书对象"""
    stmt = (
        select(Document)
        .where(
            Document.case_id == case_id,
            Document.document_type == doc_type,
            Document.is_latest == True,
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_latest_document_by_case_number_and_cause(
    db: AsyncSession, case_number: str, doc_type: str, case_cause: str
) -> Optional[Document]:
    """根据案号、文书类型和案由获取最新的文书对象"""
    stmt = (
        select(Document)
        .join(Case)
        .where(
            Case.case_number == case_number,
            Case.case_cause == case_cause,
            Document.document_type == doc_type,
            Document.is_latest == True,
        )
        .limit(1)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


def _extract_name_from_details(details: str) -> str:
    """
    从details字符串中提取姓名或名称

    Args:
        details: 包含当事人详细信息的字符串

    Returns:
        提取到的姓名或名称，如果未找到则返回空字符串
    """
    lines = details.split("\n")

    for line in lines:
        # 查找以"姓名:"或"名称:"开头的行
        if line.startswith("姓名:") or line.startswith("名称:"):
            # 提取冒号后的内容并去除空白字符
            name = line.split(":", 1)[1].strip()
            # 如果有内容则返回
            if name:
                return name

    return ""


async def get_pending_cases(
    db: AsyncSession, search_term: Optional[str] = None
) -> List[Dict[str, Any]]:
    """获取所有以 '新案件-' 开头的待立案案件，并附带最新起诉状的完整 final_data"""

    stmt = (
        select(Case)
        .where(Case.case_number.like("新案件-%"))
        .order_by(Case.created_at.desc())
    )
    if search_term:
        search_like = f"%{search_term}%"
        stmt = stmt.where(
            or_(Case.case_number.like(search_like), Case.case_cause.like(search_like))
        )
    result = await db.execute(stmt)
    cases_orm = result.scalars().all()

    cases_list = []
    for case in cases_orm:
        # (修改) 初始化变量
        plaintiffs = []
        defendants = []

        # (修改) 获取最新的起诉状文档
        doc_stmt = (
            select(Document)
            .where(Document.case_id == case.id, Document.document_type == "起诉状")
            .order_by(Document.version.desc())
            .limit(1)
        )
        doc_res = await db.execute(doc_stmt)
        latest_claim_doc = doc_res.scalars().first()

        # 解析并附带 final_data
        final_data = None
        if latest_claim_doc and latest_claim_doc.final_data:
            final_data = json.loads(latest_claim_doc.final_data)

            party_info = final_data.get("partyInfo", [])
            for party in party_info:
                role = party.get("role", "")
                details = party.get("details", "")

                # 提取原告信息
                if role.startswith("原告"):
                    name = _extract_name_from_details(details)
                    if name:
                        plaintiffs.append(name)

                # 提取被告信息
                elif role.startswith("被告"):
                    name = _extract_name_from_details(details)
                    if name:
                        defendants.append(name)

        cases_list.append(
            {
                "id": case.id,
                "case_number": case.case_number,
                "case_cause": case.case_cause,
                "created_at": case.created_at.isoformat(),
                "plaintiff": "、".join(plaintiffs) or "未知",
                "defendant": "、".join(defendants) or "未知",
            }
        )
    return cases_list


async def get_system_stats(db: AsyncSession) -> Dict[str, Any]:
    now = datetime.utcnow()
    today = now.date()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)

    # --- 查询语句定义 (已重构) ---

    # 基础条件
    filed_case_filter = Case.case_number.notlike("新案件-%")

    # 1. 基础统计
    total_cases_stmt = select(func.count(Case.id))
    pending_cases_stmt = total_cases_stmt.where(Case.case_number.like("新案件-%"))

    # 2. 本月/本年立案数
    this_month_filed_stmt = total_cases_stmt.where(
        filed_case_filter,
        extract("year", Case.created_at) == now.year,
        extract("month", Case.created_at) == now.month,
    )
    this_year_filed_stmt = total_cases_stmt.where(
        filed_case_filter, extract("year", Case.created_at) == now.year
    )

    # 3. 本月热门案由
    monthly_top_causes_stmt = (
        select(Case.case_cause, func.count(Case.id).label("count"))
        .where(Case.created_at >= start_of_month, filed_case_filter)
        .group_by(Case.case_cause)
        .order_by(func.count(Case.id).desc())
        .limit(5)
    )

    # 4. 本周每日立案数
    weekly_daily_trend_stmt = (
        select(func.date(Case.created_at), func.count(Case.id))
        .where(Case.created_at >= start_of_week, Case.case_number.notlike("新案件-%"))
        .group_by(func.date(Case.created_at))
        .order_by(func.date(Case.created_at))
    )

    # 5. 本周案由分布
    weekly_cause_dist_stmt = (
        select(Case.case_cause, func.count(Case.id).label("count"))
        .where(Case.created_at >= start_of_week, Case.case_number.notlike("新案件-%"))
        .group_by(Case.case_cause)
        .order_by(func.count(Case.id).desc())
    )

    # --- 并发执行 ---
    async def _scalar(stmt):
        return (await db.execute(stmt)).scalar_one_or_none() or 0

    async def _all(stmt):
        return (await db.execute(stmt)).all()

    tasks = [
        _scalar(total_cases_stmt),
        _scalar(pending_cases_stmt),
        _scalar(select(func.count(Document.id))),
        _scalar(this_month_filed_stmt),
        _scalar(this_year_filed_stmt),
        _all(monthly_top_causes_stmt),
        _all(weekly_daily_trend_stmt),
        _all(weekly_cause_dist_stmt),
    ]

    results = await asyncio.gather(*tasks)
    total, pending, docs, month, year, m_causes, w_trend, w_causes = results

    # --- 补全本周每日数据 ---
    trend_data = {
        (
            item[0]
            if isinstance(item[0], date)
            else datetime.strptime(item[0], "%Y-%m-%d").date()
        ): item[1]
        for item in w_trend
    }
    full_week_trend = []
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        full_week_trend.append({"date": day_str, "count": trend_data.get(day, 0)})

    return {
        "total_cases": total,
        "pending_cases": pending,
        "filed_cases": total - pending,
        "total_documents": docs,
        "this_month_filed": month,
        "this_year_filed": year,
        "monthly_top_causes": [{"cause": row[0], "count": row[1]} for row in m_causes],
        "weekly_daily_trend": full_week_trend,
        "weekly_cause_distribution": [
            {"cause": row[0], "count": row[1]} for row in w_causes
        ],
    }


async def deactivate_ai_model(db: AsyncSession, model_type: ModelType) -> bool:
    """
    取消指定类型模型的所有激活状态。
    """
    column_map = {
        "general": AIModel.is_active_general,
        "vision": AIModel.is_active_vision,
        "fast": AIModel.is_active_fast,
    }
    if model_type not in column_map:
        raise ValueError(f"未知的模型类型: {model_type}")

    target_column = column_map[model_type]

    # 将该类型的所有模型的激活状态设为 False
    result = await db.execute(update(AIModel).values({target_column.name: False}))
    await db.commit()

    return result.rowcount > 0


async def get_recent_documents_summary(db: AsyncSession, days: int = 30) -> str:
    """
    获取近期指定天数内所有文书的核心摘要文本，用于AI分析。
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    stmt = (
        select(Document.document_type, Document.final_data, Case.case_cause)
        .join(Case)
        .where(Document.created_at >= start_date)
        .order_by(Document.created_at.desc())
        .limit(10)  # (新增) 限制最多分析50份文书，防止文本过长超出AI的token限制
    )

    result = await db.execute(stmt)
    documents = result.all()

    summary_parts = []
    for i, (doc_type, final_data_json, case_cause) in enumerate(documents):
        try:
            final_data = json.loads(final_data_json)

            # (复用) 使用我们已有的文本格式化函数
            doc_text = format_final_data_to_text(final_data)

            summary_parts.append(
                f"--- 案件 {i+1} (案由: {case_cause}, 文书类型: {doc_type}) ---\n{doc_text}\n"
            )

        except (json.JSONDecodeError, TypeError):
            # 如果 final_data 解析失败，则跳过
            continue

    if not summary_parts:
        return "近期没有可供分析的案件文书。"

    return "\n".join(summary_parts)


async def update_ai_model(
    db: AsyncSession, model_id: int, model_data: dict
) -> Optional[AIModel]:
    model = await db.get(AIModel, model_id)
    if not model:
        return None

    # 处理 capabilities 数组
    if "capabilities" in model_data:
        model_data["capabilities"] = json.dumps(model_data["capabilities"]).decode(
            "utf-8"
        )

    for key, value in model_data.items():
        setattr(model, key, value)

    await db.commit()
    await db.refresh(model)
    return model


class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # The unique key for the feature, e.g., "autocomplete", "risk_analysis"
    key: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(
        String, nullable=False
    )  # A user-friendly name, e.g., "AI智能续写"
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


# --- 在 CRUD Functions 区域新增 ---


async def get_all_feature_flags(db: AsyncSession) -> List[FeatureFlag]:
    result = await db.execute(select(FeatureFlag).order_by(FeatureFlag.id))
    return list(result.scalars().all())


async def get_feature_flag_by_key(db: AsyncSession, key: str) -> Optional[FeatureFlag]:
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    return result.scalars().first()


async def update_feature_flag(
    db: AsyncSession, key: str, is_enabled: bool
) -> Optional[FeatureFlag]:
    flag = await get_feature_flag_by_key(db, key)
    if flag:
        flag.is_enabled = is_enabled
        await db.commit()
        await db.refresh(flag)
    return flag


async def create_feature_flag_if_not_exists(
    db: AsyncSession, key: str, name: str, description: str, initial_state: bool
):
    """Creates a feature flag only if it doesn't already exist."""
    existing_flag = await get_feature_flag_by_key(db, key)
    if not existing_flag:
        new_flag = FeatureFlag(
            key=key, name=name, description=description, is_enabled=initial_state
        )
        db.add(new_flag)
        await db.commit()
        print(f"Created feature flag: {key}")
