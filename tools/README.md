# Eye-tracking data pipeline

`src/data/eyeData.json` and `src/assets/eye-atlas.png` were measured from `gecko.mp4`
(iris position, eye-opening mask, blink visibility and travel limits for every frame).

If you ever replace the video, regenerate them:

1. `ffmpeg -i gecko.mp4 -vsync 0 full/f_%03d.png`
2. `python3 1_detect_eyes.py`   (needs opencv-python, numpy)
3. `python3 2_pack_eye_data.py` (writes eyedata.json + atlas.png → copy into src/)
4. `python3 3_check_masks.py 2,30,60 3` to eyeball the masks

The thresholds are tuned for this character (mint skin, blue-grey sclera, green iris).
