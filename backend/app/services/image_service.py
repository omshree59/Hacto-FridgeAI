import io
import uuid
import base64
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image, ImageOps, UnidentifiedImageError
from fastapi import UploadFile, HTTPException, status
from backend.app.core.config import settings


class ImageService:
    @staticmethod
    def validate_and_process_upload(
        file: UploadFile,
        max_dimension: int = 1280
    ) -> Tuple[str, str, int, int]:
        """
        Validates an uploaded image, fixes EXIF orientation,
        downsamples safely if exceeding max_dimension, and writes an optimized version.
        Returns: (saved_relative_path, base64_data, width, height)
        """
        # 1. Check content type
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image type: '{file.content_type}'. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
            )

        # 2. Read contents with size limit
        contents = file.file.read()
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Image size ({len(contents) / (1024*1024):.1f}MB) exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        # 3. Decode image with Pillow safely
        try:
            image = Image.open(io.BytesIO(contents))
            # Verify actual image content
            image.verify()
            # Reopen for transformation (verify invalidates image buffer)
            image = Image.open(io.BytesIO(contents))
        except (UnidentifiedImageError, Exception) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is not a valid or readable image."
            ) from exc

        # 4. Correct EXIF orientation
        try:
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass  # If EXIF is corrupt or missing, keep original

        # Convert to RGB if RGBA/P/other
        if image.mode in ("RGBA", "P", "LA"):
            image = image.convert("RGB")

        # 5. Downsample if needed while preserving aspect ratio
        orig_w, orig_h = image.size
        if max(orig_w, orig_h) > max_dimension:
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        
        cur_w, cur_h = image.size

        # 6. Encode to JPEG buffer and base64
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85, optimize=True)
        processed_bytes = buffer.getvalue()
        base64_data = base64.b64encode(processed_bytes).decode("utf-8")

        # 7. Save file locally with unique secure filename
        file_id = f"fridge_{uuid.uuid4().hex[:12]}.jpg"
        save_path = settings.UPLOAD_DIR / file_id
        save_path.write_bytes(processed_bytes)

        return file_id, base64_data, cur_w, cur_h

    @staticmethod
    def delete_image_file(filename: Optional[str]) -> bool:
        """Deletes an image from the local uploads directory."""
        if not filename:
            return False
        
        # Path traversal guard
        safe_name = Path(filename).name
        file_path = settings.UPLOAD_DIR / safe_name
        if file_path.exists() and file_path.is_file():
            try:
                file_path.unlink()
                return True
            except OSError:
                return False
        return False
