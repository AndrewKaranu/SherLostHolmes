"""
Cloudinary Configuration and Helper Functions
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import os

load_dotenv()

# Configure Cloudinary with environment variables
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


def get_cloudinary_config():
    """Return current Cloudinary configuration (without secrets)"""
    return {
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "configured": bool(
            os.getenv("CLOUDINARY_CLOUD_NAME") and
            os.getenv("CLOUDINARY_API_KEY") and
            os.getenv("CLOUDINARY_API_SECRET")
        )
    }


def upload_image(
    file,
    folder: str = "sherlostholmes",
    public_id: str = None,
    transformation: dict = None,
    tags: list = None,
    resource_type: str = "image"
):
    """
    Upload an image to Cloudinary
    
    Args:
        file: File path, URL, or base64 data
        folder: Folder to store the image in
        public_id: Custom public ID (optional)
        transformation: Dict of transformations to apply on upload
        tags: List of tags to assign
        resource_type: Type of resource (image, video, raw)
    
    Returns:
        Upload result containing secure_url, public_id, etc.
    """
    upload_options = {
        "folder": folder,
        "resource_type": resource_type,
        "overwrite": True,
    }
    
    if public_id:
        upload_options["public_id"] = public_id
    
    if transformation:
        upload_options["transformation"] = transformation
    
    if tags:
        upload_options["tags"] = tags
    
    result = cloudinary.uploader.upload(file, **upload_options)
    return result


def upload_image_with_blur(file, folder: str = "sherlostholmes", public_id: str = None, tags: list = None):
    """
    Upload an image and return both clear and blurred versions
    
    Args:
        file: File path, URL, or base64 data
        folder: Folder to store the image in
        public_id: Custom public ID (optional)
        tags: List of tags to assign
    
    Returns:
        Dict with clear_url and blurred_url
    """
    # Upload the original (clear) image
    upload_options = {
        "folder": folder,
        "resource_type": "image",
        "overwrite": True,
    }
    
    if public_id:
        upload_options["public_id"] = public_id
    
    if tags:
        upload_options["tags"] = tags
    
    # Add eager transformation for blurred version
    upload_options["eager"] = [
        {"effect": "blur:2000", "quality": "auto"}
    ]
    
    result = cloudinary.uploader.upload(file, **upload_options)
    
    # Get the blurred URL from eager transformations
    blurred_url = None
    if result.get("eager") and len(result["eager"]) > 0:
        blurred_url = result["eager"][0].get("secure_url")
    else:
        # Fallback: construct blurred URL manually
        blurred_url = cloudinary.CloudinaryImage(result["public_id"]).build_url(
            effect="blur:2000",
            quality="auto",
            secure=True
        )
    
    return {
        "public_id": result["public_id"],
        "clear_url": result["secure_url"],
        "blurred_url": blurred_url,
        "format": result.get("format"),
        "width": result.get("width"),
        "height": result.get("height"),
        "bytes": result.get("bytes"),
        "created_at": result.get("created_at")
    }


def delete_image(public_id: str, resource_type: str = "image"):
    """
    Delete an image from Cloudinary
    
    Args:
        public_id: The public ID of the image to delete
        resource_type: Type of resource (image, video, raw)
    
    Returns:
        Deletion result
    """
    result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    return result


def get_image_url(public_id: str, transformations: dict = None):
    """
    Generate a URL for an image with optional transformations
    
    Args:
        public_id: The public ID of the image
        transformations: Dict of transformations to apply
    
    Returns:
        Secure URL string
    """
    img = cloudinary.CloudinaryImage(public_id)
    
    if transformations:
        return img.build_url(secure=True, **transformations)
    
    return img.build_url(secure=True)


def get_blurred_url(public_id: str, blur_strength: int = 2000):
    """
    Generate a blurred URL for an image
    
    Args:
        public_id: The public ID of the image
        blur_strength: Blur intensity (default: 2000 for heavy blur)
    
    Returns:
        Secure URL string with blur effect
    """
    return cloudinary.CloudinaryImage(public_id).build_url(
        effect=f"blur:{blur_strength}",
        quality="auto",
        secure=True
    )


def test_cloudinary_connection():
    """
    Test if Cloudinary is properly configured
    
    Returns:
        Dict with connection status
    """
    try:
        config = get_cloudinary_config()
        if not config["configured"]:
            return {
                "status": "error",
                "message": "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file"
            }
        
        # Try to ping the API
        result = cloudinary.api.ping()
        return {
            "status": "success",
            "message": "Cloudinary connection successful",
            "cloud_name": config["cloud_name"]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Cloudinary connection failed: {str(e)}"
        }
