import os
import time
import io
from fastapi import HTTPException, status, UploadFile
from PIL import Image

IMAGE_UPLOAD_DIRECTORY = "uploads/fracture_images"
IMAGE_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
IMAGE_MAX_FILE_SIZE = 20 * 1024 * 1024
TARGET_SIZE = (640, 640)

os.makedirs(IMAGE_UPLOAD_DIRECTORY, exist_ok=True)


def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in IMAGE_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Supported: {', '.join(IMAGE_ALLOWED_EXTENSIONS)}"
        )

    if getattr(file, "size", None) and file.size > IMAGE_MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {IMAGE_MAX_FILE_SIZE / (1024*1024):.0f}MB"
        )


def resize_image_to_640(image_bytes: bytes) -> tuple[bytes, int, int, dict]:
    """Resize image to 640x640 while maintaining aspect ratio and padding"""
    img = Image.open(io.BytesIO(image_bytes))
    original_width, original_height = img.size

    if img.mode == 'RGBA':
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    aspect_ratio = original_width / original_height
    if aspect_ratio > 1:
        new_width = TARGET_SIZE[0]
        new_height = int(TARGET_SIZE[0] / aspect_ratio)
    else:
        new_height = TARGET_SIZE[1]
        new_width = int(TARGET_SIZE[1] * aspect_ratio)

    img = img.resize((new_width, new_height), Image.LANCZOS)
    new_img = Image.new('RGB', TARGET_SIZE, (0, 0, 0))
    paste_x = (TARGET_SIZE[0] - new_width) // 2
    paste_y = (TARGET_SIZE[1] - new_height) // 2
    new_img.paste(img, (paste_x, paste_y))

    padding_info = {
        "offset_x": paste_x,
        "offset_y": paste_y,
        "content_width": new_width,
        "content_height": new_height
    }

    output = io.BytesIO()
    new_img.save(output, format='JPEG', quality=95)
    resized_bytes = output.getvalue()

    return resized_bytes, original_width, original_height, padding_info


def save_uploaded_file(file_bytes: bytes, filename: str, user_id: int) -> str:
    """Save uploaded image file to disk"""
    timestamp = int(time.time())
    unique_filename = f"user_{user_id}_{timestamp}_{filename}"
    file_path = os.path.join(IMAGE_UPLOAD_DIRECTORY, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)

    return file_path.replace("\\", "/")
