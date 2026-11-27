import json,numpy as np,glob,re,os
V=json.load(open('vocab_all.json'))
exec(open('vocab.py').read().split("words=top_n_list")[0])  # norm, STOP
def key(w):
    n=norm(w)
    if n.startswith('ال') and len(n)>=4: n=n[2:]
    return n
E=np.concatenate([np.concatenate([np.load(f) for f in sorted(glob.glob(f'e3/{m}/*.npy'))]).astype(np.float32) for m in ['qwenI','bge','gemma']],axis=1)/np.sqrt(3)
keep=[];seen=set()
for i,w in enumerate(V['disp']):
    k=key(w)
    if len(k)<2 or k in seen: continue
    seen.add(k);keep.append(i)
E=E[keep];D=[V['disp'][i] for i in keep];K_=[key(w) for w in D];N=len(D)
print('vocab',len(V['disp']),'->',N)
idx={k:i for i,k in enumerate(K_)}
AMB=set('جمل رجل ذهب عين حكم شعر جد حر'.split())
sec=[]
for w in open('secrets.txt').read().split():
    if '_' in w or w in AMB: continue
    k=key(w)
    if k in idx and idx[k] not in sec: sec.append(idx[k])
rng=np.random.default_rng(7); rng.shuffle(sec); print('secrets',len(sec))
def bg(w): w='^'+w+'$'; return set(w[k:k+2] for k in range(len(w)-1))
BG=[bg(k) for k in K_]
K=1500
top=np.zeros((len(sec),K),dtype=np.uint16)
# score thresholds at sampled ranks: 1..300 each, 301..1500 every 10, then every 100
RANKS=list(range(1,301))+list(range(310,1501,10))+list(range(1600,N+1,100))
thr=np.zeros((len(sec),len(RANKS)),dtype=np.float16)
for s,i in enumerate(sec):
    sims=E@E[i]; o=np.argsort(-sims); head=o[:6000]; b=BG[i]
    pen=np.array([2*len(b&BG[j])/(len(b)+len(BG[j])) for j in head])
    sc=sims[head]-0.15*pen; hs=np.argsort(-sc); head=head[hs]; sc=sc[hs]
    head=list(head[head!=i]) if False else [j for j in head if j!=i]
    sc_list=[float(x) for j,x in zip(head,sc[[k for k in range(len(sc))]][:len(head)+1]) ]
    # recompute aligned scores without the secret
    scs=[float(sims[j]-0.15*2*len(b&BG[j])/(len(b)+len(BG[j]))) for j in head]
    top[s,0]=i; top[s,1:]=head[:K-1]
    full=[1e9]+scs+[float(sims[j]) for j in o[6000:]]   # rank r -> full[r-1]
    thr[s]=np.array([full[min(r-1,len(full)-1)] for r in RANKS],dtype=np.float16)
mu=E.mean(0);X=E-mu
U,Sv,Vt=np.linalg.svd(X[np.random.default_rng(1).choice(N,8000,replace=False)],full_matrices=False)
Dm=64;P=X@Vt[:Dm].T;q=np.clip(np.round(P/np.abs(P).max()*127),-127,127).astype(np.int8)
out='/home/user/diwania-plus/worker/src/ctx'
open(out+'/vocab.txt','w').write('\n'.join(D))
open(out+'/emb.bin','wb').write(np.array([N,Dm],dtype=np.int32).tobytes()+q.tobytes())
open(out+'/top.bin','wb').write(np.array([len(sec),K],dtype=np.uint16).tobytes()+top.tobytes())
open(out+'/sec.bin','wb').write(np.array([len(sec),E.shape[1]],dtype=np.int32).tobytes()+E[sec].astype(np.float16).tobytes())
open(out+'/thr.bin','wb').write(np.array([len(sec),len(RANKS)],dtype=np.int32).tobytes()+np.array(RANKS,dtype=np.int32).tobytes()+thr.tobytes())
print({f:os.path.getsize(out+'/'+f) for f in os.listdir(out)})
