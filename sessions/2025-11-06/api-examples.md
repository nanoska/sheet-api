# API Examples - VersionFile Endpoints

## Authentication
All requests require JWT authentication (except login).

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# Response
{
  "access": "eyJ0eXAiOiJKV1Q...",
  "refresh": "eyJ0eXAiOiJKV1Q..."
}

# Use access token in subsequent requests
TOKEN="your_access_token_here"
```

## List Version Files

```bash
# Get all version files
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/version-files/

# Response
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "version": 1,
      "version_title": "Dueto Version",
      "theme_title": "Test Theme",
      "version_type": "DUETO",
      "file_type": "DUETO_TRANSPOSITION",
      "file_type_display": "Dueto - Transposición",
      "tuning": "Bb",
      "tuning_display": "Si bemol - Clave de Sol",
      "instrument": null,
      "instrument_name": null,
      "file": "http://localhost:8000/media/...",
      "audio": null,
      "has_audio": false,
      "description": "",
      "created_at": "2025-11-06T10:00:00Z",
      "updated_at": "2025-11-06T10:00:00Z"
    }
  ]
}

# Filter by version
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/?version=1"

# Filter by file type
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/?file_type=DUETO_TRANSPOSITION"

# Filter by tuning
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/?tuning=Bb"
```

## Get Version File Detail

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/version-files/1/

# Response (with nested data)
{
  "id": 1,
  "version": {
    "id": 1,
    "theme": 1,
    "theme_title": "Test Theme",
    "title": "Dueto Version",
    "type": "DUETO",
    "type_display": "Dueto",
    ...
  },
  "file_type": "DUETO_TRANSPOSITION",
  "file_type_display": "Dueto - Transposición",
  "tuning": "Bb",
  "tuning_display": "Si bemol - Clave de Sol",
  "instrument": null,
  "file": "http://localhost:8000/media/...",
  "audio": null,
  "has_audio": false,
  "description": "",
  "created_at": "2025-11-06T10:00:00Z",
  "updated_at": "2025-11-06T10:00:00Z"
}
```

## Create Version File

### DUETO Transposition

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "version=1" \
  -F "file_type=DUETO_TRANSPOSITION" \
  -F "tuning=Bb" \
  -F "file=@/path/to/dueto_bb.pdf" \
  -F "audio=@/path/to/audio.mp3" \
  -F "description=Dueto en Si bemol" \
  http://localhost:8000/api/v1/version-files/

# Response: Created VersionFile object with status 201
```

### ENSAMBLE Instrument

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "version=2" \
  -F "file_type=ENSAMBLE_INSTRUMENT" \
  -F "instrument=1" \
  -F "file=@/path/to/trumpet.pdf" \
  http://localhost:8000/api/v1/version-files/

# Response: Created VersionFile object with status 201
```

### STANDARD Score

```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "version=3" \
  -F "file_type=STANDARD_SCORE" \
  -F "file=@/path/to/score.pdf" \
  http://localhost:8000/api/v1/version-files/

# Response: Created VersionFile object with status 201
```

## Update Version File

```bash
# Update description and add audio
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -F "description=Updated description" \
  -F "audio=@/path/to/new_audio.mp3" \
  http://localhost:8000/api/v1/version-files/1/

# Response: Updated VersionFile object

# Update file
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/updated.pdf" \
  http://localhost:8000/api/v1/version-files/1/

# Response: Updated VersionFile object
```

## Delete Version File

```bash
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/version-files/1/

# Response: 204 No Content
```

## Get Files by Version

```bash
# Get all files for version 1
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/by_version/?version_id=1"

# Response: Array of VersionFile objects
[
  {
    "id": 1,
    "file_type": "DUETO_TRANSPOSITION",
    "tuning": "Bb",
    ...
  },
  {
    "id": 2,
    "file_type": "DUETO_TRANSPOSITION",
    "tuning": "Eb",
    ...
  },
  {
    "id": 3,
    "file_type": "DUETO_TRANSPOSITION",
    "tuning": "C",
    ...
  },
  {
    "id": 4,
    "file_type": "DUETO_TRANSPOSITION",
    "tuning": "C_BASS",
    ...
  }
]
```

## Download for Instrument (Smart Selection)

```bash
# Get appropriate file for Trumpet (Bb, Treble) on DUETO version
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/download_for_instrument/?version_id=1&instrument_id=1"

# Response: VersionFile object with tuning=Bb
{
  "id": 1,
  "file_type": "DUETO_TRANSPOSITION",
  "tuning": "Bb",
  "file": "http://localhost:8000/media/.../dueto_Bb.pdf",
  ...
}

# Get appropriate file for Tuba (C, Bass) on DUETO version
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/download_for_instrument/?version_id=1&instrument_id=4"

# Response: VersionFile object with tuning=C_BASS
{
  "id": 4,
  "file_type": "DUETO_TRANSPOSITION",
  "tuning": "C_BASS",
  "file": "http://localhost:8000/media/.../dueto_C_BASS.pdf",
  ...
}

# Get file for Trumpet on ENSAMBLE version
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/download_for_instrument/?version_id=2&instrument_id=1"

# Response: VersionFile object with instrument=1
{
  "id": 5,
  "file_type": "ENSAMBLE_INSTRUMENT",
  "instrument": 1,
  "instrument_name": "Trumpet",
  "file": "http://localhost:8000/media/.../trumpet.pdf",
  ...
}

# Get file for any instrument on STANDARD version
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/download_for_instrument/?version_id=3&instrument_id=1"

# Response: VersionFile object with file_type=STANDARD_SCORE
{
  "id": 6,
  "file_type": "STANDARD_SCORE",
  "file": "http://localhost:8000/media/.../standard_score.pdf",
  ...
}
```

## Error Responses

### Missing Required Fields

```bash
# Try to create DUETO without tuning
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "version=1" \
  -F "file_type=DUETO_TRANSPOSITION" \
  -F "file=@/path/to/file.pdf" \
  http://localhost:8000/api/v1/version-files/

# Response: 400 Bad Request
{
  "tuning": ["Tuning is required for DUETO_TRANSPOSITION type"]
}
```

### Wrong Version Type

```bash
# Try to create DUETO file for ENSAMBLE version
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "version=2" \  # This is an ENSAMBLE version
  -F "file_type=DUETO_TRANSPOSITION" \
  -F "tuning=Bb" \
  -F "file=@/path/to/file.pdf" \
  http://localhost:8000/api/v1/version-files/

# Response: 400 Bad Request
{
  "file_type": ["DUETO_TRANSPOSITION can only be used with DUETO versions"]
}
```

### File Not Found for Instrument

```bash
# Try to get file that doesn't exist
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/v1/version-files/download_for_instrument/?version_id=1&instrument_id=999"

# Response: 404 Not Found
{
  "error": "No file found for this instrument and version combination"
}
```

### Unauthorized

```bash
# Request without token
curl http://localhost:8000/api/v1/version-files/

# Response: 401 Unauthorized
{
  "detail": "Authentication credentials were not provided."
}
```

## Python Requests Examples

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Login
response = requests.post(
    f"{BASE_URL}/auth/login/",
    json={"username": "admin", "password": "password"}
)
token = response.json()["access"]
headers = {"Authorization": f"Bearer {token}"}

# List version files
response = requests.get(f"{BASE_URL}/version-files/", headers=headers)
files = response.json()["results"]

# Create DUETO file
with open("dueto_bb.pdf", "rb") as pdf_file:
    response = requests.post(
        f"{BASE_URL}/version-files/",
        headers=headers,
        data={
            "version": 1,
            "file_type": "DUETO_TRANSPOSITION",
            "tuning": "Bb",
            "description": "Dueto en Si bemol"
        },
        files={"file": pdf_file}
    )
version_file = response.json()

# Get file for instrument
response = requests.get(
    f"{BASE_URL}/version-files/download_for_instrument/",
    headers=headers,
    params={"version_id": 1, "instrument_id": 1}
)
file_to_download = response.json()

# Download the PDF
pdf_response = requests.get(file_to_download["file"])
with open("downloaded.pdf", "wb") as f:
    f.write(pdf_response.content)
```

## JavaScript/TypeScript Fetch Examples

```typescript
const BASE_URL = "http://localhost:8000/api/v1";

// Login
const loginResponse = await fetch(`${BASE_URL}/auth/login/`, {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({username: "admin", password: "password"})
});
const { access: token } = await loginResponse.json();

// List version files
const listResponse = await fetch(`${BASE_URL}/version-files/`, {
  headers: {"Authorization": `Bearer ${token}`}
});
const { results: files } = await listResponse.json();

// Create version file
const formData = new FormData();
formData.append("version", "1");
formData.append("file_type", "DUETO_TRANSPOSITION");
formData.append("tuning", "Bb");
formData.append("file", pdfFile);  // File object from input

const createResponse = await fetch(`${BASE_URL}/version-files/`, {
  method: "POST",
  headers: {"Authorization": `Bearer ${token}`},
  body: formData
});
const createdFile = await createResponse.json();

// Get file for instrument
const downloadResponse = await fetch(
  `${BASE_URL}/version-files/download_for_instrument/?version_id=1&instrument_id=1`,
  {headers: {"Authorization": `Bearer ${token}`}}
);
const fileToDownload = await downloadResponse.json();

// Open PDF in new tab
window.open(fileToDownload.file, "_blank");
```
