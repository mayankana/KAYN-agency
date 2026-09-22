import cv2, json, numpy as np, glob, sys
d=json.load(open('eyedata.json')); atlas=cv2.imread('atlas.png',0)
files=sorted(glob.glob('full/f_*.png'))
ks=[int(x) for x in sys.argv[1].split(',')]
rows=[]
for k in ks:
    im=cv2.imread(files[k]); tiles=[]
    for i in range(2):
        cx,cy,vis,x0,y0=d['frames'][k][i][:5]
        crop=im[y0:y0+160,x0:x0+160].copy()
        t=k*2+i; T=d["tile"]; tile=atlas[(t//24)*T:(t//24+1)*T,(t%24)*T:(t%24+1)*T]
        m=cv2.resize(tile,(160,160),interpolation=cv2.INTER_LINEAR)
        cnts,_=cv2.findContours((m>127).astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(crop,cnts,-1,(0,0,255),1)
        cv2.circle(crop,(int(cx-x0),int(cy-y0)),int(d['rI'][i]),(255,200,0),1)
        cv2.putText(crop,f'{k} v{vis:.2f}',(4,14),cv2.FONT_HERSHEY_SIMPLEX,0.45,(255,255,255),1)
        tiles.append(crop)
    rows.append(np.hstack(tiles))
n=int(sys.argv[2]) if len(sys.argv)>2 else 3
g=np.vstack([np.hstack(rows[i:i+n]) for i in range(0,len(rows),n)])
cv2.imwrite(sys.argv[3] if len(sys.argv)>3 else 'masks_check.png',g); print(g.shape)
