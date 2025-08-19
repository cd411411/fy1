# app/config.py (已更新)

import os
from pydantic_settings import BaseSettings
from typing import Literal

AppMode = Literal["court", "open"]

class Settings(BaseSettings):
    # 声明所有需要从环境变量读取的变量
    APP_MODE: AppMode = "open"
    DATABASE_URL: str = "sqlite+aiosqlite:///./documents.db"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "adminP@ssword"
    SECRET_KEY: str = "a_very_secret_key_for_jwt_that_should_be_long_and_random"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8小时

    # Pydantic-Settings 配置
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        # 让字段名不区分大小写
        case_sensitive = False

    # --- 衍生属性 ---
    
    @property
    def SYNC_DATABASE_URL(self) -> str:
        # 自动生成同步的数据库URL，供Alembic使用
        return self.DATABASE_URL.replace("+aiosqlite", "").replace("+asyncpg", "")

    @property
    def is_court_mode(self) -> bool:
        return self.APP_MODE == "court"

    @property
    def is_defense_case_number_required(self) -> bool:
        return self.is_court_mode

    @property
    def is_verification_code_required_for_defense(self) -> bool:
        return self.is_court_mode

# 创建全局单例配置对象
settings = Settings()

# 打印加载的模式以供调试
print(f"Application running in '{settings.APP_MODE}' mode.")
print(f"Database URL: {settings.DATABASE_URL}")