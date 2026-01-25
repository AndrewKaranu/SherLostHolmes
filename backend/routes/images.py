"""
Image Upload Routes using Cloudinary
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List
import base64
import cloudinary_config

router = APIRouter(prefix="/api/images", tags=["images"])


# ============== Pydantic Models ==============
class ImageUploadResponse(BaseModel):
    public_id: str
    clear_url: str
    blurred_url: Optional[str] = None
    format: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    bytes: Optional[int] = None


class ImageUrlRequest(BaseModel):
    public_id: str
    transformations: Optional[dict] = None


class DeleteImageRequest(BaseModel):
    public_id: str


class UploadFromUrlRequest(BaseModel):
    url: str
    folder: Optional[str] = "sherlostholmes"
    public_id: Optional[str] = None
    tags: Optional[List[str]] = None
    create_blur: bool = True


class UploadFromBase64Request(BaseModel):
    base64_data: str  # Base64 encoded image data (with or without data URI prefix)
    folder: Optional[str] = "sherlostholmes"
    public_id: Optional[str] = None
    tags: Optional[List[str]] = None
    create_blur: bool = True


# ============== Endpoints ==============

@router.get("/test")
def test_cloudinary():
    """Test Cloudinary connection"""
    return cloudinary_config.test_cloudinary_connection()


@router.get("/config")
def get_config():
    """Get Cloudinary configuration (without secrets)"""
    return cloudinary_config.get_cloudinary_config()


@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    folder: str = Form(default="sherlostholmes"),
    public_id: Optional[str] = Form(default=None),
    tags: Optional[str] = Form(default=None),
    create_blur: bool = Form(default=True)
):
    """
    Upload an image file to Cloudinary
    
    - **file**: Image file to upload
    - **folder**: Folder to store the image in (default: sherlostholmes)
    - **public_id**: Custom public ID (optional)
    - **tags**: Comma-separated list of tags (optional)
    - **create_blur**: Whether to create a blurred version (default: true)
    """
    try:
        # Read file contents
        contents = await file.read()
        
        # Convert to base64 data URI
        base64_data = base64.b64encode(contents).decode("utf-8")
        content_type = file.content_type or "image/jpeg"
        data_uri = f"data:{content_type};base64,{base64_data}"
        
        # Parse tags
        tag_list = None
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        
        if create_blur:
            result = cloudinary_config.upload_image_with_blur(
                file=data_uri,
                folder=folder,
                public_id=public_id,
                tags=tag_list
            )
        else:
            upload_result = cloudinary_config.upload_image(
                file=data_uri,
                folder=folder,
                public_id=public_id,
                tags=tag_list
            )
            result = {
                "public_id": upload_result["public_id"],
                "clear_url": upload_result["secure_url"],
                "blurred_url": None,
                "format": upload_result.get("format"),
                "width": upload_result.get("width"),
                "height": upload_result.get("height"),
                "bytes": upload_result.get("bytes")
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload-url", response_model=ImageUploadResponse)
def upload_from_url(request: UploadFromUrlRequest):
    """
    Upload an image from a URL to Cloudinary
    
    - **url**: URL of the image to upload
    - **folder**: Folder to store the image in (default: sherlostholmes)
    - **public_id**: Custom public ID (optional)
    - **tags**: List of tags (optional)
    - **create_blur**: Whether to create a blurred version (default: true)
    """
    try:
        if request.create_blur:
            result = cloudinary_config.upload_image_with_blur(
                file=request.url,
                folder=request.folder,
                public_id=request.public_id,
                tags=request.tags
            )
        else:
            upload_result = cloudinary_config.upload_image(
                file=request.url,
                folder=request.folder,
                public_id=request.public_id,
                tags=request.tags
            )
            result = {
                "public_id": upload_result["public_id"],
                "clear_url": upload_result["secure_url"],
                "blurred_url": None,
                "format": upload_result.get("format"),
                "width": upload_result.get("width"),
                "height": upload_result.get("height"),
                "bytes": upload_result.get("bytes")
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/upload-base64", response_model=ImageUploadResponse)
def upload_from_base64(request: UploadFromBase64Request):
    """
    Upload an image from base64 data to Cloudinary
    
    - **base64_data**: Base64 encoded image (with or without data URI prefix)
    - **folder**: Folder to store the image in (default: sherlostholmes)
    - **public_id**: Custom public ID (optional)
    - **tags**: List of tags (optional)
    - **create_blur**: Whether to create a blurred version (default: true)
    """
    try:
        # Ensure proper data URI format
        data = request.base64_data
        if not data.startswith("data:"):
            # Assume it's a JPEG if no format specified
            data = f"data:image/jpeg;base64,{data}"
        
        if request.create_blur:
            result = cloudinary_config.upload_image_with_blur(
                file=data,
                folder=request.folder,
                public_id=request.public_id,
                tags=request.tags
            )
        else:
            upload_result = cloudinary_config.upload_image(
                file=data,
                folder=request.folder,
                public_id=request.public_id,
                tags=request.tags
            )
            result = {
                "public_id": upload_result["public_id"],
                "clear_url": upload_result["secure_url"],
                "blurred_url": None,
                "format": upload_result.get("format"),
                "width": upload_result.get("width"),
                "height": upload_result.get("height"),
                "bytes": upload_result.get("bytes")
            }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.delete("/delete")
def delete_image(request: DeleteImageRequest):
    """
    Delete an image from Cloudinary
    
    - **public_id**: The public ID of the image to delete
    """
    try:
        result = cloudinary_config.delete_image(request.public_id)
        
        if result.get("result") == "ok":
            return {"status": "success", "message": f"Image {request.public_id} deleted successfully"}
        elif result.get("result") == "not found":
            raise HTTPException(status_code=404, detail=f"Image {request.public_id} not found")
        else:
            return {"status": "unknown", "result": result}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.post("/url")
def get_image_url(request: ImageUrlRequest):
    """
    Generate a URL for an image with optional transformations
    
    - **public_id**: The public ID of the image
    - **transformations**: Dict of Cloudinary transformations (optional)
    
    Example transformations:
    - {"width": 300, "height": 300, "crop": "fill"}
    - {"effect": "blur:500"}
    - {"quality": "auto", "fetch_format": "auto"}
    """
    try:
        url = cloudinary_config.get_image_url(
            public_id=request.public_id,
            transformations=request.transformations
        )
        return {"url": url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate URL: {str(e)}")


@router.get("/blur/{public_id:path}")
def get_blurred_url(public_id: str, blur_strength: int = 2000):
    """
    Get a blurred URL for an image
    
    - **public_id**: The public ID of the image (can include folder path)
    - **blur_strength**: Blur intensity (default: 2000)
    """
    try:
        url = cloudinary_config.get_blurred_url(
            public_id=public_id,
            blur_strength=blur_strength
        )
        return {"url": url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate blurred URL: {str(e)}")
