# MediaPipe Model Files

This directory is used to serve MediaPipe model files statically.

## Required Model

Download the Hand Landmarker model and place it here:

```
hand_landmarker.task
```

### Download URL

```
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
```

### Quick download (PowerShell)

```powershell
Invoke-WebRequest -Uri "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task" -OutFile "public/models/hand_landmarker.task"
```

### Quick download (curl)

```bash
curl -L -o public/models/hand_landmarker.task \
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
```

## Notes

- The model file is ~5 MB (float16 variant).
- It is NOT committed to git (see `.gitignore`).
- The WASM runtime files are loaded from CDN by default.
