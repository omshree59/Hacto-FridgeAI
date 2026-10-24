import io
import pytest
from PIL import Image
from fastapi import UploadFile, HTTPException
from backend.app.services.image_service import ImageService


def test_valid_image_processing():
    # Create test in-memory RGB JPEG image
    img = Image.new("RGB", (2000, 1500), color=(120, 200, 90))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)

    upload_file = UploadFile(
        filename="test_fridge.jpg",
        file=buffer,
        headers={"content-type": "image/jpeg"}
    )

    filename, b64_data, width, height = ImageService.validate_and_process_upload(upload_file, max_dimension=1000)
    assert filename.startswith("fridge_")
    assert filename.endswith(".jpg")
    assert len(b64_data) > 0
    # Downsampled
    assert max(width, height) <= 1000

    # Cleanup created test file
    ImageService.delete_image_file(filename)


def test_invalid_mime_type():
    buffer = io.BytesIO(b"fake pdf content")
    upload_file = UploadFile(
        filename="document.pdf",
        file=buffer,
        headers={"content-type": "application/pdf"}
    )
    with pytest.raises(HTTPException) as exc:
        ImageService.validate_and_process_upload(upload_file)
    assert exc.value.status_code == 400


def test_corrupted_image():
    buffer = io.BytesIO(b"not an image data at all")
    upload_file = UploadFile(
        filename="corrupted.jpg",
        file=buffer,
        headers={"content-type": "image/jpeg"}
    )
    with pytest.raises(HTTPException) as exc:
        ImageService.validate_and_process_upload(upload_file)
    assert exc.value.status_code == 400
