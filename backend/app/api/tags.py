from fastapi import APIRouter, HTTPException, status
from ..schemas import TagCreate, TagOut
from ..crud import get_tags, create_tag, delete_tag

router = APIRouter()


@router.get("", response_model=list[TagOut])
def list_tags():
    return [TagOut.model_validate(t) for t in get_tags()]


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def add_tag(body: TagCreate):
    try:
        tag = create_tag(body.name.strip(), body.color)
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Ce tag existe déjà")
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    return TagOut.model_validate(tag)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag(tag_id: int):
    if not delete_tag(tag_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tag introuvable")
