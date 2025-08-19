# create_admin.py (新文件)

import asyncio
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine
from app.database import Base, User
from app.security import get_password_hash
from app.config.config import settings

# 使用同步引擎来创建用户，因为这只是一个简单的脚本
engine = create_engine(settings.SYNC_DATABASE_URL)

async def create_admin_user():
    # 简单的 session 管理
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    
    with Session() as session:
        # 检查用户是否已存在
        user = session.query(User).filter_by(username=settings.ADMIN_USERNAME).first()
        if not user:
            hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            admin_user = User(
                username=settings.ADMIN_USERNAME, 
                hashed_password=hashed_password,
                role="admin"
            )
            session.add(admin_user)
            session.commit()
            print(f"Admin user '{settings.ADMIN_USERNAME}' created successfully.")
        else:
            print(f"Admin user '{settings.ADMIN_USERNAME}' already exists.")

if __name__ == "__main__":
    # 在脚本中，我们可以直接运行
    # 注意：在Alembic创建表之后再运行此脚本
    # 运行 `alembic upgrade head`
    # 然后运行 `python create_admin.py`
    
    # 因为我们的应用是异步的，需要一个事件循环
    # 但对于简单的同步操作，我们可以直接这样
    
    # 确保表已创建
    Base.metadata.create_all(bind=engine)
    
    # 为了演示，我们用同步的方式来写
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=engine)
    with Session() as session:
        user = session.query(User).filter_by(username=settings.ADMIN_USERNAME).first()
        if not user:
            hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            admin_user = User(username=settings.ADMIN_USERNAME, hashed_password=hashed_password, role="admin")
            session.add(admin_user)
            session.commit()
            print(f"Admin user '{settings.ADMIN_USERNAME}' created successfully.")
        else:
            print(f"Admin user '{settings.ADMIN_USERNAME}' already exists.")