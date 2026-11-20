# modest.py in.jpg out.jpg → keeps only the face (forehead to chin) clear; hair, neck and body are blurred.
import sys, cv2, numpy as np
def modest(src, dst):
    im = cv2.imread(src); h, w = im.shape[:2]
    g = cv2.equalizeHist(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY))
    det = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = det.detectMultiScale(g, 1.08, 6, minSize=(w // 12, w // 12))
    if len(faces) == 0: return False
    mask = np.zeros((h, w), np.float32)
    big = max(f[2] for f in faces)
    for (x, y, fw, fh) in [f for f in faces if f[2] >= big * 0.6]:
        # the oval: eyebrows to chin, cheek to cheek (hair outside stays blurred)
        cx, cy = x + fw / 2, y + fh * 0.60
        cv2.ellipse(mask, (int(cx), int(cy)), (int(fw * 0.37), int(fh * 0.49)), 0, 0, 360, 1.0, -1)
    k = max(3, int(min(w, h) * 0.035)) | 1
    mask = cv2.GaussianBlur(mask, (k, k), 0)[..., None]
    s = max(9, int(min(w, h) * 0.16)) | 1
    small = cv2.resize(im, (max(8, w // 28), max(8, h // 28)), interpolation=cv2.INTER_AREA); blur = cv2.GaussianBlur(cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR), (s, s), 0)
    out = (im * mask + blur * (1 - mask)).astype(np.uint8)
    cv2.imwrite(dst, out, [cv2.IMWRITE_JPEG_QUALITY, 90]); return True
if __name__ == '__main__': print(modest(sys.argv[1], sys.argv[2]))
