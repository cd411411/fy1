# app/database.py

import asyncio
import os
from re import X
import secrets
import string
import orjson as json
from datetime import date, datetime, timedelta, timezone
from typing import Dict, Any, Optional, List, AsyncGenerator, Tuple
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
    JSON,
    Index,
    UniqueConstraint,
    func,
    or_,
    select,
    text,
    update,
    delete,
    extract,
)
from sqlalchemy.orm import declarative_base, relationship, Mapped, mapped_column
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.security import get_password_hash
from app.utils.utils import format_final_data_to_text
import redis.asyncio as redis
from .config.config import settings
import random
from sqlalchemy.orm import selectinload
from .cache import get_redis_client
from .services import ocr_service
from pathlib import Path

ModelType = Literal["general", "vision", "fast"]
RagModelType = Literal["embedding", "rerank"]


# --- 在创建引擎之前，确保数据库文件所在的目录存在 ---
if settings.DATABASE_URL.startswith("sqlite"):
    db_url = settings.DATABASE_URL
    # 移除 'sqlite+aiosqlite:///' 前缀来获取文件路径
    db_file_path_str = db_url.split(":///")[1]
    
    # 使用 pathlib 来处理路径并创建父目录
    db_file_path = Path(db_file_path_str)
    db_dir = db_file_path.parent
    
    print(f"Ensuring database directory exists at: {db_dir.resolve()}")
    os.makedirs(db_dir, exist_ok=True) 

# --- SQLAlchemy Setup ---
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()

# --- ORM Models ---


def generate_verification_code():
    # 排除易混淆字符
    uppercase_letters = "".join(
        c for c in string.ascii_uppercase if c not in "OIL")
    lowercase_letters = "".join(
        c for c in string.ascii_lowercase if c not in "oil")
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
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
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
    name: Mapped[str] = mapped_column(
        String, nullable=False, comment="被告姓名或名称")
    verification_code: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, default=generate_verification_code
    )

    case = relationship("Case", back_populates="defendants")
    documents = relationship(
        "Document", back_populates="author_defendant")  # 答辩状


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
    is_latest: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True)
    form_data: Mapped[str] = mapped_column(Text, nullable=False)
    final_data: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc)
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
    is_active_fast: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

# --- VectorStore 模型 ---


class VectorStore(Base):
    __tablename__ = "vector_stores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_cause: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    document_groups = relationship("DocumentGroup", back_populates="store", cascade="all, delete-orphan")


class DocumentGroup(Base):
    __tablename__ = "document_groups"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    store_id: Mapped[int] = mapped_column(Integer, ForeignKey("vector_stores.id"), nullable=False)
    
    name: Mapped[str] = mapped_column(String, nullable=False, comment="文档组名称")
    embedding_model_name: Mapped[Optional[str]] = mapped_column(String) 
    source_filenames: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    store = relationship("VectorStore", back_populates="document_groups")

# --- RagModel 模型 ---


class RagModel(Base):
    __tablename__ = "rag_models"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    api_endpoint: Mapped[str] = mapped_column(String)
    model_type: Mapped[str] = mapped_column(String, nullable=False) # 'embedding' or 'rerank'
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    api_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    output_dim: Mapped[Optional[int]] = mapped_column(Integer, comment="仅 Embedding 模型需要, 输出向量维度")
    similarity_top_k: Mapped[Optional[int]] = mapped_column(Integer, comment="仅 Embedding 模型需要, 初步检索数量")
    rerank_top_k: Mapped[Optional[int]] = mapped_column(Integer, comment="仅 Rerank 模型需要, 最终返回数量")


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
        update_stmt = update_stmt.where(
            Document.author_defendant_id == defendant_id)

    await db.execute(update_stmt.values(is_latest=False))

    # 2. 获取新版本号
    version_stmt = select(func.max(Document.version)).where(
        Document.case_id == case_id, Document.document_type == doc_type
    )
    if doc_type == "答辩状" and defendant_id:
        version_stmt = version_stmt.where(
            Document.author_defendant_id == defendant_id)

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
    """根据指定的能力类型获取激活的模型，优先使用Redis缓存"""
    redis_client = get_redis_client()
    cache_key = f"active_model:{model_type}"

    # 1. 先从缓存读取
    try:
        redis_client = get_redis_client()
        cached_model_json = await redis_client.get(cache_key)
        if cached_model_json:
            print(f"CACHE HIT for active model: {model_type}")
            model_data = json.loads(cached_model_json)
            return AIModel(**model_data)
    except redis.RedisError as e:
        # 捕获所有 redis-py 的异常
        print(
            f"WARNING: Redis GET error for key '{cache_key}'. Falling back to DB. Error: {e}")
        redis_client = None  # 标记Redis不可用
    except Exception as e:
        print(
            f"WARNING: An unexpected error occurred with Redis GET. Falling back to DB. Error: {e}")
        redis_client = None

    # 2. 缓存未命中，查询数据库
    print(f"CACHE MISS for active model: {model_type}")
    column_map = {"general": AIModel.is_active_general,
                  "vision": AIModel.is_active_vision, "fast": AIModel.is_active_fast}
    if model_type not in column_map:
        raise ValueError(f"未知的模型类型: {model_type}")

    stmt = select(AIModel).where(column_map[model_type] == True).limit(1)
    result = await db.execute(stmt)
    model = result.scalars().first()

    # 3. 将结果写入缓存
    if model and redis_client:
        try:
            # 将ORM对象转换为字典以便序列化
            model_data = {c.name: getattr(model, c.name)
                          for c in model.__table__.columns}
            # 缓存5分钟
            await redis_client.set(cache_key, json.dumps(model_data), ex=300)
        except Exception as e:
            print(f"Redis SET error for key '{cache_key}': {e}")

    return model


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

        count_stmt = select(func.count(Document.id)).where(
            Document.case_id == case.id)
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

    try:
        redis_client = get_redis_client()
        await redis_client.delete(f"active_model:{model_type}")
        print(f"Cache invalidated for active model: {model_type}")
        await redis_client.set(f"active_model:{model_type}", model_id)
    except redis.RedisError as e:
        print(
            f"WARNING: Redis DELETE error for key 'active_model:{model_type}'. Error: {e}")

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
    role: Literal["plaintiff", "defendant"]
) -> Optional[Case]:
    """
    根据案号和指定角色的验证码查找案件对象。
    """
    if role == "plaintiff":
        # 原告的验证码在 Case 表中，直接查询
        stmt = select(Case).where(
            Case.case_number == case_number,
            Case.plaintiff_code == code
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    elif role == "defendant":
        # 被告的验证码在 Defendant 表中，需要通过关联查询
        stmt = (
            select(Case)
            .join(Case.defendants)  # JOIN 到 defendants 关联关系
            .where(
                Case.case_number == case_number,
                Defendant.verification_code == code
            )
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    return None


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
            or_(Case.case_number.like(search_like),
                Case.case_cause.like(search_like))
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
    now = datetime.now(timezone.utc)
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
        full_week_trend.append(
            {"date": day_str, "count": trend_data.get(day, 0)})

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

    try:
        redis_client = get_redis_client()
        await redis_client.delete(f"active_model:{model_type}")
        print(f"Cache invalidated for active model: {model_type}")
    except redis.RedisError as e:
        print(
            f"WARNING: Redis DELETE error for key 'active_model:{model_type}'. Error: {e}")

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

    try:
        redis_client = get_redis_client()
        await redis_client.delete("active_model:general", "active_model:vision", "active_model:fast")
        print("All active model caches cleared due to model update.")
    except redis.RedisError as e:
        print(
            f"WARNING: Redis cache clearing failed during model update. Error: {e}")

    return model


class FeatureFlag(Base):
    __tablename__ = "feature_flags"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # The unique key for the feature, e.g., "autocomplete", "risk_analysis"
    key: Mapped[str] = mapped_column(
        String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(
        String, nullable=False
    )  # A user-friendly name, e.g., "AI智能续写"
    description: Mapped[str] = mapped_column(Text, nullable=True)
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False)


# --- 在 CRUD Functions 区域新增 ---


async def get_all_feature_flags(db: AsyncSession) -> List[FeatureFlag]:
    """
    获取所有功能开关，优先使用Redis缓存

    该函数首先尝试从Redis缓存中获取所有功能开关，如果缓存未命中，
    则从数据库中查询所有功能开关，并将结果缓存到Redis中。

    Args:
        db (AsyncSession): 数据库会话对象

    Returns:
        List[FeatureFlag]: 功能开关列表

    Example:
        flags = await get_all_feature_flags(db)
        for flag in flags:
            print(f"{flag.key}: {flag.is_enabled}")
    """
    redis_client = get_redis_client()
    cache_key = "feature_flags:all"

    # 1. 先尝试从缓存获取
    try:
        cached_flags_json = await redis_client.get(cache_key)
        if cached_flags_json:
            print("CACHE HIT for all feature flags")
            cached_flags = json.loads(cached_flags_json)
            # 从字典列表重建FeatureFlag对象列表
            return [FeatureFlag(**flag_data) for flag_data in cached_flags]
    except Exception as e:
        print(f"Redis GET error for key '{cache_key}': {e}")

    # 2. 缓存未命中，查询数据库
    print("CACHE MISS for all feature flags")
    result = await db.execute(select(FeatureFlag).order_by(FeatureFlag.id))
    flags = list(result.scalars().all())

    # 3. 将结果写入缓存
    try:
        # 将ORM对象转换为字典列表以便序列化
        flags_data = []
        for flag in flags:
            flag_data = {c.name: getattr(flag, c.name)
                         for c in flag.__table__.columns}
            flags_data.append(flag_data)

        # 缓存10分钟
        await redis_client.set(cache_key, json.dumps(flags_data), ex=600)
    except Exception as e:
        print(f"Redis SET error for key '{cache_key}': {e}")

    return flags


async def get_feature_flag_by_key(db: AsyncSession, key: str) -> Optional[FeatureFlag]:
    """
    根据键名获取功能开关，优先使用Redis缓存

    该函数首先尝试从Redis缓存中获取指定键名的功能开关，如果缓存未命中，
    则从数据库中查询该功能开关，并将结果缓存到Redis中。

    Args:
        db (AsyncSession): 数据库会话对象
        key (str): 功能开关键名

    Returns:
        Optional[FeatureFlag]: 功能开关对象，如果未找到则返回None

    Example:
        flag = await get_feature_flag_by_key(db, "autocomplete")
        if flag and flag.is_enabled:
            print("Autocomplete feature is enabled")
    """
    redis_client = get_redis_client()
    cache_key = f"feature_flag:{key}"

    # 1. 先尝试从缓存获取
    try:
        cached_flag_json = await redis_client.get(cache_key)
        if cached_flag_json:
            print(f"CACHE HIT for feature flag: {key}")
            flag_data = json.loads(cached_flag_json)
            # 从字典重建FeatureFlag对象
            return FeatureFlag(**flag_data)
    except Exception as e:
        print(f"Redis GET error for key '{cache_key}': {e}")

    # 2. 缓存未命中，查询数据库
    print(f"CACHE MISS for feature flag: {key}")
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalars().first()

    # 3. 将结果写入缓存
    if flag:
        try:
            # 将ORM对象转换为字典以便序列化
            flag_data = {c.name: getattr(flag, c.name)
                         for c in flag.__table__.columns}
            # 缓存10分钟
            await redis_client.set(cache_key, json.dumps(flag_data), ex=600)
        except Exception as e:
            print(f"Redis SET error for key '{cache_key}': {e}")

    return flag


async def update_feature_flag(
    db: AsyncSession, key: str, is_enabled: bool
) -> Optional[FeatureFlag]:
    """
    更新功能开关状态

    该函数更新指定键名的功能开关状态，并清除相关Redis缓存以确保数据一致性。

    Args:
        db (AsyncSession): 数据库会话对象
        key (str): 功能开关键名
        is_enabled (bool): 新的状态值

    Returns:
        Optional[FeatureFlag]: 更新后的功能开关对象，如果未找到则返回None

    Example:
        updated_flag = await update_feature_flag(db, "autocomplete", True)
        if updated_flag:
            print(f"Feature flag '{updated_flag.key}' updated to {updated_flag.is_enabled}")
    """
    stmt = (
        update(FeatureFlag)
        .where(FeatureFlag.key == key)
        .values(is_enabled=is_enabled)
        .returning(FeatureFlag)
    )

    result = await db.execute(stmt)
    updated_flag = result.scalar_one_or_none()

    if updated_flag:
        await db.commit()

        try:
            redis_client = get_redis_client()
            await redis_client.delete(f"feature_flag:{key}", "feature_flags:all")
            print(f"Cache invalidated for '{key}' and 'feature_flags:all'.")
        except Exception as e:
            print(
                f"WARNING: Redis cache clearing failed during flag update. Error: {e}")

    return updated_flag


async def create_feature_flag_if_not_exists(
    db: AsyncSession, key: str, name: str, description: str, initial_state: bool
):
    """
    创建功能开关（如果不存在）

    该函数检查指定键名的功能开关是否已存在，如果不存在则创建新功能开关。
    这是一个幂等操作，可以安全地多次调用。

    Args:
        db (AsyncSession): 数据库会话对象
        key (str): 功能开关键名，必须唯一
        name (str): 功能开关的用户友好名称
        description (str): 功能开关的详细描述
        initial_state (bool): 功能开关的初始状态

    Example:
        await create_feature_flag_if_not_exists(
            db, 
            "autocomplete", 
            "AI智能续写", 
            "在用户输入停顿时，提供续写建议。", 
            True
        )

    Note:
        - 该操作是幂等的，多次调用不会创建重复的功能开关
        - 创建成功后会打印日志信息
        - 该函数不返回任何值
    """
    existing_flag = await get_feature_flag_by_key(db, key)
    if not existing_flag:
        new_flag = FeatureFlag(
            key=key, name=name, description=description, is_enabled=initial_state
        )
        db.add(new_flag)
        await db.commit()
        print(f"Created feature flag: {key}")
        # 清除缓存以确保新创建的功能开关能被正确获取
        try:
            redis_client = get_redis_client()
            await redis_client.delete("feature_flags:all")
            print("Cache cleared for all feature flags after creation")
        except Exception as e:
            print(f"Redis DELETE error when creating feature flag: {e}")


class AIUsageLog(Base):
    __tablename__ = "ai_usage_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("ai_models.id"), nullable=False)
    model_name: Mapped[str] = mapped_column(String, nullable=False)

    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)

    request_source: Mapped[Optional[str]] = mapped_column(
        String, comment="API call source, e.g., 'chat'")
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    model = relationship("AIModel")

# --- 在 CRUD Functions 区域新增 ---


async def log_ai_usage(
    db: AsyncSession,
    model_id: int,
    model_name: str,
    # usage_data from OpenAI is a dict like {'prompt_tokens':..., 'completion_tokens':...}
    usage_data: dict,
    request_source: Optional[str] = None
):
    """(已修复) 记录一次AI API调用的详细token使用量"""

    prompt_tokens = usage_data.get("prompt_tokens", 0)
    completion_tokens = usage_data.get("completion_tokens", 0)
    total_tokens = usage_data.get(
        "total_tokens", prompt_tokens + completion_tokens)  # 如果API没返回total，我们自己算

    new_log = AIUsageLog(
        model_id=model_id,
        model_name=model_name,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        request_source=request_source
    )
    db.add(new_log)
    await db.commit()


async def get_ai_usage_stats(db: AsyncSession) -> Dict[str, Any]:
    """(已升级) 获取AI Token使用量的精细化统计数据"""
    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_month = now.replace(
        day=1, hour=0, minute=0, second=0, microsecond=0)

    # === START: 核心修改 - 定义多个聚合函数 ===
    sum_prompt = func.sum(AIUsageLog.prompt_tokens).label("prompt_total")
    sum_completion = func.sum(
        AIUsageLog.completion_tokens).label("completion_total")
    sum_total = func.sum(AIUsageLog.total_tokens).label("total")
    # === END: 核心修改 ===

    # 查询
    total_usage_stmt = select(sum_prompt, sum_completion, sum_total)
    today_usage_stmt = total_usage_stmt.where(
        AIUsageLog.created_at >= start_of_today)
    month_usage_stmt = total_usage_stmt.where(
        AIUsageLog.created_at >= start_of_month)

    # 按模型分组统计
    by_model_stmt = select(
        AIUsageLog.model_name, sum_prompt, sum_completion, sum_total
    ).group_by(AIUsageLog.model_name).order_by(sum_total.desc())

    # (新增) 按功能来源分组统计
    by_source_stmt = select(
        AIUsageLog.request_source, sum_prompt, sum_completion, sum_total
    ).group_by(AIUsageLog.request_source).order_by(sum_total.desc())

    # 并发执行
    async def _execute_one(stmt): return (
        await db.execute(stmt)).first() or (0, 0, 0)

    async def _execute_all(stmt): return (await db.execute(stmt)).all()

    # (修改) 扩展并发任务
    tasks = [
        _execute_one(total_usage_stmt),
        _execute_one(today_usage_stmt),
        _execute_one(month_usage_stmt),
        _execute_all(by_model_stmt),
        _execute_all(by_source_stmt)  # (新增)
    ]

    total, today, month, by_model_res, by_source_res = await asyncio.gather(*tasks)

    return {
        "total_usage": {"prompt": total[0], "completion": total[1], "total": total[2]},
        "today_usage": {"prompt": today[0], "completion": today[1], "total": today[2]},
        "this_month_usage": {"prompt": month[0], "completion": month[1], "total": month[2]},
        "by_model": [
            {"model_name": row[0], "prompt_tokens": row[1] or 0,
                "completion_tokens": row[2] or 0, "total_tokens": row[3] or 0}
            for row in by_model_res
        ],
        "by_source": [
            {"source": row[0] or "未知", "prompt_tokens": row[1] or 0,
                "completion_tokens": row[2] or 0, "total_tokens": row[3] or 0}
            for row in by_source_res
        ]
    }


async def create_admin_user_if_not_exists(db: AsyncSession):
    """
    检查管理员用户是否存在，如果不存在，则根据环境变量创建。
    这是一个幂等操作。
    """
    admin_username = settings.ADMIN_USERNAME

    # 检查用户是否已存在
    user = await get_user_by_username(db, admin_username)

    if not user:
        # 如果不存在，则创建
        hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
        admin_user = User(
            username=admin_username,
            hashed_password=hashed_password,
            role="admin"
        )
        db.add(admin_user)
        await db.commit()
        print(f"Admin user '{admin_username}' created successfully.")
    else:
        print(
            f"Admin user '{admin_username}' already exists. Skipping creation.")


async def get_vector_store_by_cause(db: AsyncSession, case_cause: str) -> Optional[VectorStore]:
    """根据案由获取向量库的配置信息"""
    result = await db.execute(select(VectorStore).where(VectorStore.case_cause == case_cause))
    return result.scalars().first()


async def get_active_rag_model(db: AsyncSession, model_type: Literal["embedding", "rerank"]) -> Optional[RagModel]:
    """(缓存逻辑) 根据类型获取激活的RAG模型，优先使用Redis缓存"""
    redis_client = get_redis_client()
    cache_key = f"active_rag_model:{model_type}"

    # 1. 尝试从缓存读取
    try:
        cached_model_json = await redis_client.get(cache_key)
        if cached_model_json:
            print(f"CACHE HIT for active RAG model: {model_type}")
            model_data = json.loads(cached_model_json)
            return RagModel(**model_data)
    except Exception as e:
        print(f"WARNING: Redis GET for RAG model failed. Falling back to DB. Error: {e}")

    # 2. 缓存未命中，查询数据库
    print(f"CACHE MISS for active RAG model: {model_type}")
    stmt = select(RagModel).where(RagModel.model_type == model_type, RagModel.is_active == True).limit(1)
    result = await db.execute(stmt)
    model = result.scalars().first()

    # 3. 将结果写入缓存
    if model:
        try:
            model_data = {c.name: getattr(model, c.name) for c in model.__table__.columns}
            await redis_client.set(cache_key, json.dumps(model_data), ex=300) # 缓存5分钟
        except Exception as e:
            print(f"WARNING: Redis SET for RAG model failed. Error: {e}")

    return model


async def get_all_rag_models(db: AsyncSession) -> List[RagModel]:
    """获取所有RAG模型（Embedding和Rerank）"""
    result = await db.execute(select(RagModel).order_by(RagModel.model_type, RagModel.id))
    return list(result.scalars().all())


async def add_rag_model(db: AsyncSession, model_data: dict) -> RagModel:
    """添加一个新的RAG模型"""
    # 如果新模型要被激活，需要先取消同类型其他模型的激活状态
    if model_data.get("is_active"):
        await db.execute(
            update(RagModel)
            .where(RagModel.model_type == model_data["model_type"])
            .values(is_active=False)
        )
    
    new_model = RagModel(**model_data)
    db.add(new_model)
    await db.commit()
    await db.refresh(new_model)

    # (缓存逻辑) 如果添加的模型是激活的，使缓存失效
    if new_model.is_active:
        try:
            redis_client = get_redis_client()
            await redis_client.delete(f"active_rag_model:{new_model.model_type}")
            print(f"CACHE INVALIDATED for active RAG model: {new_model.model_type}")
        except Exception as e:
            print(f"WARNING: Redis cache invalidation failed after adding RAG model. Error: {e}")
    
    return new_model


async def set_active_rag_model(db: AsyncSession, model_id: int) -> bool:
    """激活一个RAG模型，并取消同类型其他模型的激活状态"""
    model_to_activate = await db.get(RagModel, model_id)
    if not model_to_activate:
        return False

    async with db.begin_nested():
        # 1. 取消同类型所有模型的激活
        await db.execute(
            update(RagModel)
            .where(RagModel.model_type == model_to_activate.model_type)
            .values(is_active=False)
        )
        # 2. 激活指定模型
        result = await db.execute(
            update(RagModel).where(RagModel.id ==
                                   model_id).values(is_active=True)
        )
    await db.commit()
    # (缓存逻辑) 使缓存失效
    if result.rowcount > 0:
        try:
            redis_client = get_redis_client()
            await redis_client.delete(f"active_rag_model:{model_to_activate.model_type}")
            print(f"CACHE INVALIDATED for active RAG model: {model_to_activate.model_type}")
        except Exception as e:
            print(f"WARNING: Redis cache invalidation failed after setting active RAG model. Error: {e}")
            
    return result.rowcount > 0

# --- Vector Stores CRUD (新增) ---


async def get_all_vector_stores(db: AsyncSession) -> List[VectorStore]:
    result = await db.execute(select(VectorStore).order_by(VectorStore.case_cause))
    return list(result.scalars().all())


async def update_vector_store_config(db: AsyncSession, store_id: int, config_data: dict) -> Optional[VectorStore]:
    store = await db.get(VectorStore, store_id)
    if store:
        for key, value in config_data.items():
            setattr(store, key, value)
        await db.commit()
        await db.refresh(store)
    return store

# --- Document Chunks CRUD (for PGVector) (新增) ---


async def add_chunks_to_store(db: AsyncSession, case_cause: str, docs: List[Dict[str, Any]]):
    store = await get_vector_store_by_cause(db, case_cause)
    if not store:
        store = VectorStore(case_cause=case_cause)
        db.add(store)
        await db.commit()
        await db.refresh(store)

    chunks_to_insert = []
    for doc in docs:
        metadata = doc["metadata"]
        # document_text 在PGVector模式下是完整的content JSON字符串
        content_json_str = metadata.get("original_content", "{}")
        chunks_to_insert.append({
            "store_id": store.id,
            "source_document_name": metadata.get("source", "Unknown"),
            "content_type": metadata.get("content_type", "chunk"),
            "content": json.loads(content_json_str),
            "embedding": doc["embedding"]
        })





async def create_vector_store(db: AsyncSession, case_cause: str) -> VectorStore:
    """创建一个新的案由向量库配置"""
    existing = await get_vector_store_by_cause(db, case_cause)
    if existing:
        raise ValueError(
            f"Case cause '{case_cause}' already has a vector store.")

    new_store = VectorStore(case_cause=case_cause)
    db.add(new_store)
    await db.commit()
    await db.refresh(new_store)
    return new_store


async def create_document_group(
    db: AsyncSession, case_cause: str, group_name: str, filenames: List[str], model_name: str
) -> DocumentGroup:
    store = await db.scalar(select(VectorStore).where(VectorStore.case_cause == case_cause))
    if not store:
        store = VectorStore(case_cause=case_cause)
        db.add(store)
        await db.flush()  # Flush to get store.id

    new_group = DocumentGroup(
        store_id=store.id,
        name=group_name,
        source_filenames=filenames,
        embedding_model_name=model_name
    )
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    return new_group





async def get_document_groups_by_store_id(db: AsyncSession, store_id: int) -> List[DocumentGroup]:
    """获取指定知识库（按store_id）下的所有文档组"""
    stmt = select(DocumentGroup).where(DocumentGroup.store_id ==
                                       store_id).order_by(DocumentGroup.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def delete_document_group(db: AsyncSession, group_id: int) -> bool:
    group = await db.get(DocumentGroup, group_id)
    if group:
        await db.delete(group)
        await db.commit()
        return True
    return False


    """分页获取文本块，并同时返回总数"""
    # 检查DocumentChunk是否已定义
    if 'DocumentChunk' not in globals():
        return [], 0

    offset = (page - 1) * page_size

    # 1. 查询分页数据
    data_stmt = select(DocumentChunk).where(
        DocumentChunk.store_id == store_id).offset(offset).limit(page_size)

    # 2. 查询总数
    count_stmt = select(func.count(DocumentChunk.id)).where(
        DocumentChunk.store_id == store_id)

    # 3. 并发执行
    data_res, count_res = await asyncio.gather(
        db.execute(data_stmt),
        db.execute(count_stmt)
    )

    chunks = list(data_res.scalars().all())
    total_count = count_res.scalar_one()

    return chunks, total_count




async def delete_vector_store(db: AsyncSession, store_id: int) -> bool:
    """删除整个向量库及其所有文本块"""
    # 由于设置了 cascade="all, delete-orphan", 删除 VectorStore 会自动删除所有关联的 DocumentChunk
    store = await db.get(VectorStore, store_id)
    if store:
        await db.delete(store)
        await db.commit()
        return True
    return False

async def deactivate_rag_model(db: AsyncSession, model_id: int) -> bool:
    """取消指定RAG模型的激活状态"""
    model_to_deactivate = await db.get(RagModel, model_id)
    if not model_to_deactivate:
        return False
        
    result = await db.execute(
        update(RagModel).where(RagModel.id == model_id).values(is_active=False)
    )
    await db.commit()

    # (缓存逻辑) 使缓存失效
    if result.rowcount > 0:
        try:
            redis_client = get_redis_client()
            await redis_client.delete(f"active_rag_model:{model_to_deactivate.model_type}")
            print(f"CACHE INVALIDATED for active RAG model: {model_to_deactivate.model_type}")
        except Exception as e:
            print(f"WARNING: Redis cache invalidation failed after deactivating RAG model. Error: {e}")

    return result.rowcount > 0

async def delete_rag_model(db: AsyncSession, model_id: int) -> bool:
    """(已修改) 删除一个RAG模型，不再检查激活状态"""
    model_to_delete = await db.get(RagModel, model_id)
    if not model_to_delete:
        return False
        
    result = await db.execute(delete(RagModel).where(RagModel.id == model_id))
    await db.commit()

    # (缓存逻辑) 如果删除的是激活的模型，使缓存失效
    if result.rowcount > 0 and model_to_delete.is_active:
        try:
            redis_client = get_redis_client()
            await redis_client.delete(f"active_rag_model:{model_to_delete.model_type}")
            print(f"CACHE INVALIDATED for active RAG model: {model_to_delete.model_type}")
        except Exception as e:
            print(f"WARNING: Redis cache invalidation failed after deleting RAG model. Error: {e}")

    return result.rowcount > 0

async def update_rag_model(db: AsyncSession, model_id: int, data: dict) -> Optional[RagModel]:
    """更新RAG模型信息"""
    model = await db.get(RagModel, model_id)
    if not model:
        return None
    for key, value in data.items():
        if value is not None:
            setattr(model, key, value)
    await db.commit()
    await db.refresh(model)

    # (缓存逻辑) 只要更新就清除缓存，因为激活状态可能改变
    try:
        redis_client = get_redis_client()
        await redis_client.delete(f"active_rag_model:{model.model_type}")
        print(f"CACHE INVALIDATED for active RAG model: {model.model_type}")
    except Exception as e:
        print(f"WARNING: Redis cache invalidation failed after updating RAG model. Error: {e}")
        
    return model


async def get_document_group_by_id(db: AsyncSession, group_id: int) -> Optional[DocumentGroup]:
    """(新增) 根据ID获取单个文档组"""
    return await db.get(DocumentGroup, group_id)


async def update_document_group_metadata(db: AsyncSession, group_id: int, metadata: dict):
    """(新增) 更新文档组的元数据"""
    await db.execute(
        update(DocumentGroup).where(DocumentGroup.id == group_id).values(**metadata)
    )
    await db.commit()

async def truncate_rag_metadata(db: AsyncSession):
    """清空所有RAG相关的元数据表"""
    # 注意：这个顺序很重要，先删子表再删父表
    await db.execute(text("TRUNCATE TABLE document_groups RESTART IDENTITY CASCADE;"))
    await db.execute(text("TRUNCATE TABLE vector_stores RESTART IDENTITY CASCADE;"))
    await db.commit()

async def delete_vector_store_by_cause(db: AsyncSession, case_cause: str):
    """
    删除指定案由的 VectorStore 元数据记录。
    注意：此函数不删除实际的向量数据 (由策略处理)。
    """
    store = await db.scalar(select(VectorStore).where(VectorStore.case_cause == case_cause))
    if store:
        await db.delete(store)
        await db.commit()