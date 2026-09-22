import cv2, numpy as np, glob, json, math
files=sorted(glob.glob('full/f_*.png'))
N=len(files); W,H=1920,1080
WIN=80   # half window for tiles (full-res px)
TILE=80  # tile size stored (160px window -> 80px: half res)

def pupils(im,prev):
    V=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)[...,2]
    dark=(V<48).astype(np.uint8); dark[470:]=0
    dark=cv2.morphologyEx(dark,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
    n,lab,stats,cent=cv2.connectedComponentsWithStats(dark)
    c=[]
    for i in range(1,n):
        x,y,w,h,a=stats[i]
        if 250<a<6000 and 0.45<w/h<1.8 and a/(np.pi*w*h/4)>0.6:
            c.append(dict(a=float(a),c=cent[i].copy()))
    best=None;bs=1e9
    for p in range(len(c)):
        for q in range(p+1,len(c)):
            A,B=sorted((c[p],c[q]),key=lambda t:t['c'][0])
            dx=B['c'][0]-A['c'][0]; dy=abs(A['c'][1]-B['c'][1])
            if not(150<dx<300) or dy>70: continue
            s=abs(A['a']-B['a'])/1900+dy/70
            if prev is not None:
                s+=(np.linalg.norm(A['c']-prev[0])+np.linalg.norm(B['c']-prev[1]))/40
            if s<bs: bs=s;best=(A,B)
    return best

def analyse_eye(im,hsv,cx,cy):
    x0=int(round(cx))-WIN; y0=int(round(cy))-WIN
    x0=max(0,min(W-2*WIN,x0)); y0=max(0,min(H-2*WIN,y0))
    h,s,v=[hsv[y0:y0+2*WIN,x0:x0+2*WIN,i].astype(int) for i in range(3)]
    white=(((s>=5)&(s<=32)&(h>=95)&(h<=140)&(v>=105))|((s<19)&(v>163)))
    iris=((s>120)&(v<205)&(h>45)&(h<105))
    dark=(v<62)
    m=(white|iris|dark).astype(np.uint8)
    yy,xx=np.mgrid[0:2*WIN,0:2*WIN]
    lc=(cx-x0,cy-y0)
    m[((xx-lc[0])**2+(yy-lc[1])**2)>72**2]=0
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    n,lab,st,ce=cv2.connectedComponentsWithStats(m)
    l=lab[int(round(lc[1])),int(round(lc[0]))]
    if l==0: return None
    comp=(lab==l).astype(np.uint8)
    cnts,_=cv2.findContours(comp,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    filled=np.zeros_like(comp); cv2.drawContours(filled,cnts,-1,1,-1)
    # remove thin leaks: open with a big disk, regrow slightly, intersect with original
    k1=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(27,27))
    opened=cv2.morphologyEx(filled,cv2.MORPH_OPEN,k1)
    k2=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9))
    regrown=cv2.dilate(opened,k2)&filled
    n3,lab3,_,_=cv2.connectedComponentsWithStats(regrown)
    l3=lab3[int(round(lc[1])),int(round(lc[0]))]
    if l3>0: filled=(lab3==l3).astype(np.uint8)
    # always keep the exact iris component in the mask
    irs=((s>120)&(v<205)&(h>45)&(h<105)|dark).astype(np.uint8)
    irs=cv2.morphologyEx(irs,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    nI,labI,_,_=cv2.connectedComponentsWithStats(irs)
    lI=labI[int(round(lc[1])),int(round(lc[0]))]
    if lI>0:
        ic=(labI==lI).astype(np.uint8)
        cI,_=cv2.findContours(ic,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
        icf=np.zeros_like(ic); cv2.drawContours(icf,cI,-1,1,-1)
        filled=filled|icf
    # iris only comp
    im_m=(iris|dark).astype(np.uint8)
    im_m=cv2.morphologyEx(im_m,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
    n2,lab2,st2,ce2=cv2.connectedComponentsWithStats(im_m)
    l2=lab2[int(round(lc[1])),int(round(lc[0]))]
    iris_area=float((lab2==l2).sum()) if l2>0 else 0.0
    return dict(mask=filled,x0=x0,y0=y0,iris_area=iris_area,white=white&(filled>0))

frames=[]; prev=None
for k,f in enumerate(files):
    im=cv2.imread(f); hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV)
    b=pupils(im,prev)
    if b is None: frames.append(None); continue
    prev=(b[0]['c'],b[1]['c'])
    eyes=[]
    for E in b:
        r=analyse_eye(im,hsv,*E['c'])
        eyes.append(dict(c=E['c'],pa=E['a'],an=r,im=im))
    frames.append(eyes)
missing=[k for k,e in enumerate(frames) if e is None or any(x['an'] is None for x in e)]
print('missing frames:',missing)
import pickle
pickle.dump([ [dict(c=x['c'],pa=x['pa'],an=x['an']) for x in e] if e else None for e in frames], open('det.pkl','wb'))
areas=np.array([[x['pa'] for x in e] if e else [0,0] for e in frames])
print('pupil area median',np.median(areas,axis=0), 'min',areas.min(0))
ia=np.array([[x['an']['iris_area'] if x['an'] else 0 for x in e] if e else [0,0] for e in frames])
print('iris area p50/p90/max',np.percentile(ia,50,axis=0),np.percentile(ia,90,axis=0),ia.max(0))
print('iris r (p90)',np.sqrt(np.percentile(ia,90,axis=0)/np.pi))
