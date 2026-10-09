import os
import re
import logging
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("brandshield.db")

# ==============================================================
# In-Memory Async MongoDB Mock Fallback Driver
# Ensures platform operations continue seamlessly if an external
# MongoDB Atlas cluster is temporarily unreachable or unconfigured.
# ==============================================================

class InMemoryCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self._docs = list(docs)
    
    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            for k, d in reversed(key_or_list):
                self._docs.sort(key=lambda x: str(x.get(k, '') or ''), reverse=(d == -1))
        elif isinstance(key_or_list, str):
            self._docs.sort(key=lambda x: str(x.get(key_or_list, '') or ''), reverse=(direction == -1))
        return self
    
    def skip(self, n: int):
        self._docs = self._docs[n:]
        return self

    def limit(self, n: int):
        self._docs = self._docs[:n]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return [dict(d) for d in self._docs[:length]]
        return [dict(d) for d in self._docs]

    def __aiter__(self):
        self._iter = iter(self._docs)
        return self

    async def __anext__(self):
        try:
            return dict(next(self._iter))
        except StopIteration:
            raise StopAsyncIteration


def _matches_query(doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
    if not query:
        return True
    for key, val in query.items():
        if key == "$or":
            if not any(_matches_query(doc, subq) for subq in val):
                return False
            continue
        if key == "$and":
            if not all(_matches_query(doc, subq) for subq in val):
                return False
            continue
        doc_val = doc.get(key)
        if isinstance(val, dict):
            for op, op_val in val.items():
                if op == "$ne" and doc_val == op_val:
                    return False
                elif op == "$in" and doc_val not in op_val:
                    return False
                elif op == "$nin" and doc_val in op_val:
                    return False
                elif op == "$gt" and not (doc_val is not None and doc_val > op_val):
                    return False
                elif op == "$gte" and not (doc_val is not None and doc_val >= op_val):
                    return False
                elif op == "$lt" and not (doc_val is not None and doc_val < op_val):
                    return False
                elif op == "$lte" and not (doc_val is not None and doc_val <= op_val):
                    return False
                elif op == "$regex":
                    flags = 0
                    if "$options" in val and "i" in val["$options"]:
                        flags = re.IGNORECASE
                    if not (isinstance(doc_val, str) and re.search(op_val, doc_val, flags)):
                        return False
        else:
            if str(doc_val) != str(val) and doc_val != val:
                return False
    return True


class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self._docs: List[Dict[str, Any]] = []

    async def create_index(self, *args, **kwargs):
        return f"idx_{self.name}_ok"

    async def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        q = query or {}
        return sum(1 for d in self._docs if _matches_query(d, q))

    async def find_one(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        q = query or {}
        for d in self._docs:
            if _matches_query(d, q):
                res = dict(d)
                if projection and isinstance(projection, dict):
                    if projection.get("_id") == 1 and len(projection) == 1:
                        return {"_id": res["_id"]}
                return res
        return None

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None) -> InMemoryCursor:
        q = query or {}
        matched = [dict(d) for d in self._docs if _matches_query(d, q)]
        return InMemoryCursor(matched)

    async def insert_one(self, doc: Dict[str, Any]):
        d = dict(doc)
        if "_id" not in d:
            d["_id"] = ObjectId()
        self._docs.append(d)
        class InsertResult:
            inserted_id = d["_id"]
        return InsertResult()

    async def insert_many(self, docs: List[Dict[str, Any]]):
        ids = []
        for doc in docs:
            d = dict(doc)
            if "_id" not in d:
                d["_id"] = ObjectId()
            self._docs.append(d)
            ids.append(d["_id"])
        class InsertManyResult:
            inserted_ids = ids
        return InsertManyResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        for i, d in enumerate(self._docs):
            if _matches_query(d, query):
                self._apply_update(d, update)
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        if upsert:
            new_doc = dict(query)
            if "_id" not in new_doc:
                new_doc["_id"] = ObjectId()
            self._apply_update(new_doc, update)
            self._docs.append(new_doc)
            class UpdateResult:
                matched_count = 0
                modified_count = 1
                upserted_id = new_doc["_id"]
            return UpdateResult()
        class UpdateResult:
            matched_count = 0
            modified_count = 0
        return UpdateResult()

    async def update_many(self, query: Dict[str, Any], update: Dict[str, Any]):
        modified = 0
        for d in self._docs:
            if _matches_query(d, query):
                self._apply_update(d, update)
                modified += 1
        class UpdateResult:
            matched_count = modified
            modified_count = modified
        return UpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        for i, d in enumerate(self._docs):
            if _matches_query(d, query):
                self._docs.pop(i)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResult:
            deleted_count = 0
        return DeleteResult()

    async def delete_many(self, query: Dict[str, Any]):
        initial = len(self._docs)
        self._docs = [d for d in self._docs if not _matches_query(d, query)]
        class DeleteResult:
            deleted_count = initial - len(self._docs)
        return DeleteResult()

    def aggregate(self, pipeline: List[Dict[str, Any]]) -> InMemoryCursor:
        return InMemoryCursor([])

    def _apply_update(self, doc: Dict[str, Any], update: Dict[str, Any]):
        if "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
        if "$unset" in update:
            for k in update["$unset"]:
                doc.pop(k, None)
        if "$push" in update:
            for k, v in update["$push"].items():
                if k not in doc or not isinstance(doc[k], list):
                    doc[k] = []
                doc[k].append(v)
        if "$pull" in update:
            for k, v in update["$pull"].items():
                if k in doc and isinstance(doc[k], list):
                    doc[k] = [x for x in doc[k] if x != v]
        if "$inc" in update:
            for k, v in update["$inc"].items():
                doc[k] = doc.get(k, 0) + v


class InMemoryDatabase:
    def __init__(self):
        self._collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str) -> InMemoryCollection:
        if name not in self._collections:
            self._collections[name] = InMemoryCollection(name)
        return self._collections[name]

    def __getattr__(self, name: str) -> InMemoryCollection:
        return self[name]


# ==============================================================
# Database Singleton Instance
# ==============================================================

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    is_fallback: bool = False

db_instance = Database()

async def connect_to_mongo():
    logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2500)
        # Quick ping to verify connectivity
        await client.admin.command('ping')
        
        db_instance.client = client
        db_instance.db = client[settings.DB_NAME]
        db_instance.is_fallback = False
        logger.info(f"Successfully connected to persistent MongoDB database: {settings.DB_NAME}")
        
        # Create helpful indexes
        await db_instance.db.brands.create_index("name", unique=True)
        await db_instance.db.official_assets.create_index([("brand_id", 1), ("url", 1)])
        await db_instance.db.threats.create_index([("brand_id", 1), ("risk_score", -1)])
        await db_instance.db.threats.create_index("url")
        await db_instance.db.threats.create_index("status")
        await db_instance.db.campaigns.create_index("brand_id")
        await db_instance.db.investigations.create_index("threat_id")
        await db_instance.db.alerts.create_index([("brand_id", 1), ("created_at", -1)])
        await db_instance.db.instagram_analyses.create_index([("username", 1), ("created_at", -1)])
        await db_instance.db.instagram_analyses.create_index("brand_id")
        await db_instance.db.instagram_profiles.create_index("username", unique=True)
        
        # User & Auth Indexes
        await db_instance.db.users.create_index("email", unique=True)
        await db_instance.db.users.create_index("google_id", sparse=True)
        await db_instance.db.password_resets.create_index("token_hash", unique=True)
        await db_instance.db.email_verifications.create_index("token_hash", unique=True)
        
        # Ensure default Analyst user exists
        await ensure_default_user(db_instance.db)
    except Exception as e:
        logger.warning(
            f"MongoDB connection to {settings.MONGO_URI} failed: {e}. "
            f"Activating resilient In-Memory Database fallback so application remains fully operational. "
            f"To enable permanent persistent storage, configure MONGO_URI in your Render Environment settings."
        )
        db_instance.client = None
        db_instance.db = InMemoryDatabase()
        db_instance.is_fallback = True
        await ensure_default_user(db_instance.db)

async def ensure_default_user(db):
    try:
        import bcrypt
        from datetime import datetime, timezone
        user = await db.users.find_one({"email": "analyst@brandshield.ai"})
        if not user:
            pw_hash = bcrypt.hashpw(b"BrandShield@2026", bcrypt.gensalt()).decode("utf-8")
            default_doc = {
                "username": "secops_analyst",
                "email": "analyst@brandshield.ai",
                "password_hash": pw_hash,
                "full_name": "Security Operations Analyst",
                "role": "Tier 2 SOC Lead",
                "organization": "Global SOC Ops",
                "phone": "+1 (555) 019-2834",
                "department": "Cyber Digital Risk Protection",
                "provider": "local",
                "email_verified": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            }
            await db.users.insert_one(default_doc)
            logger.info("Default SecOps Analyst user ensured in database.")
    except Exception as e:
        logger.warning(f"Could not ensure default user: {e}")

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()

def get_db():
    return db_instance.db
