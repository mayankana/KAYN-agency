import pickle, numpy as np, cv2, json, math
det=pickle.load(open('det.pkl','rb'))
N=len(det); WIN=80; TILE=160; COLS=24; ROWS=16
R_I=[35.0,35.0]
files=None
# gather anchors, interpolate missing
c=np.full((N,2,2),np.nan); pa=np.zeros((N,2))
for k,e in enumerate(det):
    if e is None or any(x['an'] is None for x in e): continue
    for i in range(2): c[k,i]=e[i]['c']; pa[k,i]=e[i]['pa']
ok=~np.isnan(c[:,0,0])
idx=np.arange(N)
for i in range(2):
    for a in range(2):
        c[:,i,a]=np.interp(idx,idx[ok],c[ok,i,a])
# also light median clean on outliers
med=np.median(pa[ok],axis=0)
vis=np.clip((pa/med-0.55)/(0.9-0.55),0,1); vis=vis*vis*(3-2*vis)
# coverage of iris disc by eye-opening mask
cov=np.zeros((N,2))
yy,xx=np.mgrid[0:160,0:160]
for k in range(N):
    for i in range(2):
        an=det[k][i]['an'] if det[k] and det[k][i]['an'] else None
        if an is None: continue
        lx,ly=c[k,i][0]-an['x0'],c[k,i][1]-an['y0']
        disc=((xx-lx)**2+(yy-ly)**2)<(R_I[i]-4)**2
        if 'IM' not in globals() or IMK!=k:
            IM=cv2.imread(sorted(__import__('glob').glob('full/f_*.png'))[k]); IMK=k
        hh=cv2.cvtColor(IM[an['y0']:an['y0']+160,an['x0']:an['x0']+160],cv2.COLOR_BGR2HSV).astype(int)
        skin=(hh[...,0]>45)&(hh[...,0]<100)&(hh[...,1]>32)&(hh[...,1]<112)&(hh[...,2]>=100)
        cov[k,i]=max((an['mask'][disc]>0).mean(),1-skin[disc].mean())
cv=np.clip((cov-0.82)/(0.95-0.82),0,1); cv=cv*cv*(3-2*cv)
vis=vis*cv
print('cov pct 5/25/50',np.percentile(cov[ok],[5,25,50]))
# extend blink fade: neighbours of missing frames get reduced vis already via area
atlas=np.zeros((ROWS*TILE,COLS*TILE),np.uint8)
frames=[]
prev_col=[(0.86,0.87,0.86)]*2
import glob
imfiles=sorted(glob.glob('full/f_*.png'))
for k in range(N):
    row=[]
    im=None
    for i in range(2):
        an=det[k][i]['an'] if det[k] and det[k][i]['an'] else None
        cx,cy=c[k,i]
        if an is not None:
            x0,y0=an['x0'],an['y0']; mask=an['mask']; white=an['white']
        else:
            x0=int(round(cx))-WIN; y0=int(round(cy))-WIN
            x0=max(0,min(1920-2*WIN,x0)); y0=max(0,min(1080-2*WIN,y0))
            mask=np.zeros((2*WIN,2*WIN),np.uint8); white=None
        # sclera colour
        col=prev_col[i]
        if an is not None and white is not None and white.sum()>200:
            if 'im' not in locals() or im is None or im_k!=k:
                im=cv2.imread(imfiles[k]); im_k=k
            patch=im[y0:y0+2*WIN,x0:x0+2*WIN]
            sel=white.copy()
            yy,xx=np.mgrid[0:2*WIN,0:2*WIN]
            sel&=(((xx-(cx-x0))**2+(yy-(cy-y0))**2)>(R_I[i]+4)**2)
            if sel.sum()>100:
                b,g,r=patch[sel].mean(0)/255.0; col=(float(r),float(g),float(b))
        prev_col[i]=col
        # slack
        sl=[0,0,0,0]
        if an is not None:
            lx,ly=cx-x0,cy-y0
            for di,ang in enumerate([math.pi,0,-math.pi/2,math.pi/2]):  # L,R,U,D (y down: up = -y)
                best=1e9
                for phi in np.deg2rad(np.arange(-10,11,10)):
                    a=ang+phi; t=0
                    while t<120:
                        px=int(round(lx+math.cos(a)*t)); py=int(round(ly+math.sin(a)*t))
                        if px<0 or py<0 or px>=2*WIN or py>=2*WIN or mask[py,px]==0: break
                        t+=1
                    best=min(best,t)
                sl[di]=max(0.0,best-R_I[i])
        tile=cv2.GaussianBlur((mask*255).astype(np.uint8),(0,0),3.0)
        t=k*2+i; atlas[(t//COLS)*TILE:(t//COLS+1)*TILE,(t%COLS)*TILE:(t%COLS+1)*TILE]=tile
        row.append([round(float(cx),2),round(float(cy),2),round(float(vis[k,i]),3),int(x0),int(y0),
                    round(col[0],3),round(col[1],3),round(col[2],3)]+[round(float(s),1) for s in sl])
    frames.append(row)
cv2.imwrite('atlas.png',atlas,[cv2.IMWRITE_PNG_COMPRESSION,9])
data=dict(n=N,fps=24,win=WIN,tile=TILE,cols=COLS,rI=R_I,frames=frames)
F=np.array(frames,dtype=float)
def gsm(a,sig=1.3):
    r=int(3*sig); ks=np.exp(-0.5*(np.arange(-r,r+1)/sig)**2); ks/=ks.sum()
    return np.convolve(np.pad(a,(r,r),mode='wrap'),ks,mode='valid')
for e in range(2):
    for j in range(5,12): F[:,e,j]=gsm(F[:,e,j])
data['frames']=[[[ (int(v) if j in (3,4) else round(float(v),3 if j in (2,5,6,7) else 2)) for j,v in enumerate(F[k,e])] for e in range(2)] for k in range(N)]
json.dump(data,open('eyedata.json','w'),separators=(',',':'))
import os
print('atlas bytes',os.path.getsize('atlas.png'),'json bytes',os.path.getsize('eyedata.json'))
sl=np.array([[f[i][8:12] for i in range(2)] for f in frames])
print('slack L,R,U,D mean',sl.mean((0,1)),'p10',np.percentile(sl,10,axis=(0,1)),'max',sl.max((0,1)))
print('vis<0.5 frames',[k for k in range(N) if min(vis[k])<0.5])
