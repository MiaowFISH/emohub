from fastapi import APIRouter

from app.api.routes.duplicates import router as duplicates_router
from app.api.routes.gallery import router as gallery_router
from app.api.routes.health import router as health_router
from app.api.routes.images import router as images_router
from app.api.routes.internal_tasks import router as internal_tasks_router
from app.api.routes.search import router as search_router
from app.api.routes.tags import router as tags_router
from app.api.routes.uploads import router as uploads_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(uploads_router)
api_router.include_router(gallery_router)
api_router.include_router(images_router)
api_router.include_router(search_router)
api_router.include_router(tags_router)
api_router.include_router(duplicates_router)
api_router.include_router(internal_tasks_router)
