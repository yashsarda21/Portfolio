import numpy as np, cv2, math
from PIL import Image
D='/tmp/claude-0/-home-claude/568f98cc-5296-58cc-bd30-628cdb8314f7/scratchpad/seg/'
src='/root/.claude/uploads/568f98cc-5296-58cc-bd30-628cdb8314f7/c81b50a6-image.png'
img=np.array(Image.open(src).convert('RGB')).astype(np.float32)/255.
alpha=np.array(Image.open(D+'mask.png')).astype(np.float32)/255.
disp=np.load(D+'depth.npy').astype(np.float32)
H,W=alpha.shape

# --- clean depth: nearest-subject fill outside, easing to the axis depth far away
inside=(alpha>0.6).astype(np.uint8)
dist,lab=cv2.distanceTransformWithLabels(1-inside,cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
iy,ix=np.nonzero(inside)
# map label -> value of that zero pixel (labels index the inside pixels in scan order)
lab_vals=np.zeros(lab.max()+1,np.float32)
lab_inside=lab[inside==1]
lab_vals[lab_inside]=disp[inside==1]
d=lab_vals[lab]
AX=12.0
t=np.clip(dist/90.0,0,1)
d=d*(1-t)+AX*t
d[inside==1]=disp[inside==1]
d=np.clip(d,10.6,None)
d=cv2.GaussianBlur(d,(0,0),8)
S=48.0                     # px of depth per disparity unit
ys,xs=np.mgrid[0:H,0:W].astype(np.float32)
xc=705.0
# head / body weighting (head above neck, body below)
w=np.clip((900-ys)/(900-720),0,1); w=w*w*(3-2*w)
z_head=(d-AX)*S          # relative to head yaw axis (about ear depth)
z_body=(d-12.8)*S
z_nod=(d-AX)*S
# normals for relighting (from smoothed depth)
dz=cv2.GaussianBlur(d,(0,0),10)*S
gx=cv2.Sobel(dz,cv2.CV_32F,1,0,ksize=5)/32.; gy=cv2.Sobel(dz,cv2.CV_32F,0,1,ksize=5)/32.
n=np.dstack([-gx,-gy,np.ones_like(gx)]); n/=np.linalg.norm(n,axis=2,keepdims=True)
skin_bias=np.clip((900-ys)/200,0,1)   # light mostly on head/neck
ab=cv2.GaussianBlur(alpha,(0,0),3)
er=cv2.erode(alpha,np.ones((5,5),np.uint8),iterations=6)
band=np.clip(alpha-cv2.GaussianBlur(er,(0,0),4),0,1)
gxa=cv2.Sobel(ab,cv2.CV_32F,1,0,ksize=5)
left=np.clip(gxa/ (np.abs(gxa).max()*0.15),0,1)
RIM=np.clip(band*1.6,0,1)*cv2.GaussianBlur(left,(0,0),6)*np.clip((950-ys)/250,0,1)
RIM=np.clip(RIM*2.2,0,1)

def render(yaw_deg,pitch_deg,key,rim,out_w=640):
    th=math.radians(yaw_deg); ph=math.radians(pitch_deg)
    thb=th*0.28
    dx=w*(z_head*math.sin(th)+(xs-xc)*(math.cos(th)-1)) + (1-w)*(z_body*math.sin(thb))
    yc=790.0
    dy=w*(z_nod*math.sin(ph)+(ys-yc)*(math.cos(ph)-1))
    # dx,dy are a FORWARD displacement of source pixels; invert it by fixed-point iteration
    fx=cv2.GaussianBlur(dx.astype(np.float32),(0,0),20); fy=cv2.GaussianBlur(dy.astype(np.float32),(0,0),20)
    sx=xs.copy(); sy=ys.copy()
    for _ in range(8):
        fxs=cv2.remap(fx,sx,sy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
        fys=cv2.remap(fy,sx,sy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
        sx=(xs-fxs).astype(np.float32); sy=(ys-fys).astype(np.float32)
    fxs=cv2.remap(fx,sx,sy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
    fys=cv2.remap(fy,sx,sy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
    res=np.hypot(sx+fxs-xs, sy+fys-ys)
    valid=np.clip(2.0-res/3.0,0,1)
    valid=cv2.GaussianBlur(valid,(0,0),1.2)
    mx,my=sx,sy
    # relight in source space with light rotated opposite to the head
    Lk=np.array([math.sin(math.radians(35)-th),-0.35,0.85]); Lk/=np.linalg.norm(Lk)
    lam=np.clip((n*Lk).sum(2),0,1)**2.2
    keycol=np.array([1.0,0.96,0.90]); rimcol=np.array([0.86,1.0,0.35])
    add=(key*0.22*lam*skin_bias)[...,None]*keycol + (rim*0.75*RIM)[...,None]*rimcol
    lit=1-(1-img)*(1-np.clip(add,0,1))          # screen blend
    rgba=np.dstack([lit,alpha])
    out=cv2.remap(rgba,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=0)
    out=np.clip(out,0,1)
    a=out[:,:,3]*valid
    k=np.ones((5,5),np.uint8)
    op=cv2.morphologyEx((a>0.35).astype(np.uint8),cv2.MORPH_OPEN,k,iterations=2)
    # keep only the main body component
    n_,lab_,st,_=cv2.connectedComponentsWithStats(op,8)
    if n_>1:
        big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); keep=(lab_==big).astype(np.float32)
        keep=cv2.dilate(keep,np.ones((7,7),np.uint8)); keep=cv2.GaussianBlur(keep,(0,0),2)
        a=a*np.clip(keep,0,1)
    out[:,:,3]=a
    oh=round(out_w*H/W)
    out=cv2.resize(out,(out_w,oh),interpolation=cv2.INTER_AREA)
    return (out*255).astype(np.uint8)

def ease(t): return 1-(1-t)**3
def interp(keys,t):
    for (t0,v0),(t1,v1) in zip(keys,keys[1:]):
        if t0<=t<=t1:
            u=(t-t0)/(t1-t0) if t1>t0 else 1; u=u*u*(3-2*u)
            return v0+(v1-v0)*u
    return keys[-1][1]
