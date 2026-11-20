# hijab.py in.jpg out.jpg → draws a black hijab and abaya around the face (face stays clear), blurs whatever is left of the body.
import sys, cv2, numpy as np
def hijab(src, dst):
    im = cv2.imread(src); h, w = im.shape[:2]
    g = cv2.equalizeHist(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY))
    det = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = det.detectMultiScale(g, 1.08, 6, minSize=(w // 12, w // 12))
    if len(faces) == 0: return False
    big = max(f[2] for f in faces)
    # start from the approved blur so nothing outside the cloth is sharp
    s = max(9, int(min(w, h) * 0.16)) | 1
    small = cv2.resize(im, (max(8, w // 28), max(8, h // 28)), interpolation=cv2.INTER_AREA)
    out = cv2.GaussianBlur(cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR), (s, s), 0).astype(np.float32)
    for (x, y, fw, fh) in [f for f in faces if f[2] >= big * 0.6]:
        cx, cy = x + fw / 2, y + fh * 0.60
        face = np.zeros((h, w), np.float32)
        cv2.ellipse(face, (int(cx), int(cy)), (int(fw * 0.36), int(fh * 0.47)), 0, 0, 360, 1, -1)
        cloth = np.zeros((h, w), np.float32)
        # head wrap: a bit bigger than the head, from above the hair to under the chin
        cv2.ellipse(cloth, (int(cx), int(y + fh * 0.50)), (int(fw * 0.60), int(fh * 0.74)), 0, 0, 360, 1, -1)
        # the drape: from the chin down to the bottom, widening to the shoulders (abaya)
        top = int(y + fh * 0.85)
        pts = np.array([[cx - fw * 0.45, top], [cx + fw * 0.45, top], [cx + fw * 1.7, h], [cx - fw * 1.7, h]], np.int32)
        cv2.fillPoly(cloth, [pts], 1)
        cloth = np.clip(cloth - face, 0, 1)
        k = max(3, int(fw * 0.08)) | 1
        cloth = cv2.GaussianBlur(cloth, (k, k), 0)
        fsoft = cv2.GaussianBlur(face, (k, k), 0)
        # black fabric with soft folds and light from above
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        folds = 6 * np.sin((xx - cx) / (fw * 0.16) + (yy - y) / (fh * 0.9)) + 4 * np.sin((xx - cx) / (fw * 0.07))
        shade = 28 + folds - 10 * np.clip((yy - y) / (h - y + 1), 0, 1) + 14 * np.exp(-((xx - cx) ** 2 + (yy - y - fh * 0.3) ** 2) / (2 * (fw * 0.6) ** 2))
        fabric = np.stack([shade + 2, shade, shade - 1], -1)
        out = out * (1 - cloth[..., None]) + fabric * cloth[..., None]
        out = out * (1 - fsoft[..., None]) + im.astype(np.float32) * fsoft[..., None]
    cv2.imwrite(dst, np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90]); return True
if __name__ == '__main__': print(hijab(sys.argv[1], sys.argv[2]))
