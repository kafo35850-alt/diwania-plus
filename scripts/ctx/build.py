import json,numpy as np,glob,re,os
V=json.load(open('vocab_all.json'));N=len(V['norm'])
parts=[]
for m in ['qwenI','bge','gemma']:
    e=np.concatenate([np.load(f) for f in sorted(glob.glob(f'e3/{m}/*.npy'))]).astype(np.float32)
    assert e.shape[0]==N,(m,e.shape)
    parts.append(e)
E=np.concatenate(parts,axis=1)/np.sqrt(3)   # dot = mean of the 3 cosines
exec(open('vocab.py').read().split("words=top_n_list")[0])
idx={n:i for i,n in enumerate(V['norm'])}
sec=[]
for w in open('secrets.txt').read().split():
    if '_' in w: continue
    n=norm(w)
    if n in idx and idx[n] not in sec: sec.append(idx[n])
rng=np.random.default_rng(7); rng.shuffle(sec)
print('secrets',len(sec))
K=1500
top=np.zeros((len(sec),K),dtype=np.uint16)
def bg(w): w='^'+w+'$'; return set(w[k:k+2] for k in range(len(w)-1))
BG=[bg(n) for n in V['norm']]
for s,i in enumerate(sec):
    sims=E@E[i]; o=np.argsort(-sims)[:6000]; b=BG[i]
    pen=np.array([2*len(b&BG[j])/(len(b)+len(BG[j])) for j in o])
    o=o[np.argsort(-(sims[o]-0.15*pen))]; o=o[o!=i][:K-1]; top[s,0]=i; top[s,1:]=o
# PCA for the far words
mu=E.mean(0);X=E-mu
U,Sv,Vt=np.linalg.svd(X[np.random.default_rng(1).choice(N,8000,replace=False)],full_matrices=False)
D=64;P=X@Vt[:D].T
q=np.clip(np.round(P/np.abs(P).max()*127),-127,127).astype(np.int8)
out='/home/user/diwania-plus/worker/src/ctx'
open(out+'/vocab.txt','w').write('\n'.join(V['disp']))
open(out+'/emb.bin','wb').write(np.array([N,D],dtype=np.int32).tobytes()+q.tobytes())
open(out+'/top.bin','wb').write(np.array([len(sec),K],dtype=np.uint16).tobytes()+top.tobytes())
# quality check: rank correlation of PCA vs full for ranks 1000-5000
from itertools import islice
i=sec[0]; full=np.argsort(-(E@E[i])); pc=(q.astype(np.int32)@q[i].astype(np.int32))
rk=np.empty(N,int); rk[np.argsort(-pc)]=np.arange(N)
print('pca rank of full#1000..#1010:',[int(rk[j]) for j in full[1000:1010]])
for s in range(5):
    i=sec[s]; print(V['disp'][i],'→',' '.join(V['disp'][j] for j in top[s,1:20]))
print({f:os.path.getsize(out+'/'+f) for f in os.listdir(out)})
