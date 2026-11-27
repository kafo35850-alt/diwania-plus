# build2 + LLM related-word lists (llm/<secret>.txt) boost the closest words; words from the lists missing in the vocab are added.
import json,numpy as np,glob,re,os,subprocess
V=json.load(open('vocab_all.json'))
exec(open('vocab.py').read().split("words=top_n_list")[0])
def key(w):
    n=norm(w)
    if n.startswith('ال') and len(n)>=4: n=n[2:]
    return n
KEYF=open('key').read().strip()
CFG={'qwenI':('@cf/qwen/qwen3-embedding-0.6b','Instruct: Given an Arabic word, retrieve words related in meaning\nQuery: {}'),'bge':('@cf/baai/bge-m3','{}'),'gemma':('@cf/google/embeddinggemma-300m','{}')}
def embed(words):
    parts=[]
    for name,(m,t) in CFG.items():
        out=[]
        for i in range(0,len(words),300):
            for k in range(5):
                r=subprocess.run(['curl','-s','--max-time','150','-X','POST','https://diwaniyaplus.com/api/tmp-ai-'+KEYF,'-H','content-type: application/json','-d',json.dumps({'model':m,'words':[t.format(w) for w in words[i:i+300]]},ensure_ascii=False)],capture_output=True,text=True)
                try: v=np.array(json.loads(r.stdout),dtype=np.float32); assert len(v)==len(words[i:i+300]); break
                except Exception: v=None
            out.append(v/np.linalg.norm(v,axis=1,keepdims=True))
        parts.append(np.concatenate(out))
    return np.concatenate(parts,axis=1)/np.sqrt(3)
E=np.concatenate([np.concatenate([np.load(f) for f in sorted(glob.glob(f'e3/{m}/*.npy'))]).astype(np.float32) for m in CFG],axis=1)/np.sqrt(3)
D=list(V['disp'])
# LLM lists
def parse(txt,secret):
    txt=re.sub(r'\d+[\.\-\)]','،',txt); items=re.split(r'[،,\n]',txt); out=[];seen=set()
    for it in items:
        w=it.strip().strip('.«»"\'- ')
        if not re.fullmatch(r'[ء-يً-ْ]{2,15}',w): continue
        k=key(w)
        if k==key(secret) or k in seen: continue
        seen.add(k); out.append(w)
        if len(out)>=45: break
    return out
L={os.path.basename(f)[:-4]:parse(open(f).read(),os.path.basename(f)[:-4]) for f in glob.glob('llm/*.txt')}
vk={}
for i,w in enumerate(D): vk.setdefault(key(w),i)
new=sorted({w for lst in L.values() for w in lst if key(w) not in vk})
cache=json.load(open('extra_words.json')) if os.path.exists('extra_words.json') else []
need=[w for w in new if w not in cache]
if need:
    Ex=embed(need); np.save(f'extra_{len(cache)}.npy',Ex.astype(np.float16)); cache+=need; json.dump(cache,open('extra_words.json','w'),ensure_ascii=False)
if cache:
    Ex=np.concatenate([np.load(f).astype(np.float32) for f in sorted(glob.glob('extra_*.npy'),key=lambda x:int(x.split('_')[1].split('.')[0]))])
    E=np.concatenate([E,Ex]); D+=cache
print('llm lists',len(L),'extra words',len(cache))
keep=[];seen=set()
for i,w in enumerate(D):
    k=key(w)
    if len(k)<2 or k in seen: continue
    seen.add(k);keep.append(i)
E=E[keep];D=[D[i] for i in keep];K_=[key(w) for w in D];N=len(D)
idx={k:i for i,k in enumerate(K_)}
AMB=set('جمل رجل ذهب عين حكم شعر جد حر'.split())
# keep the same secret order as the live top.bin so word numbers do not change
old=open('/home/user/diwania-plus/worker/src/ctx/vocab.txt').read().split('\n') if os.path.exists('secret_order.json')==False else None
order=json.load(open('secret_order.json')) if os.path.exists('secret_order.json') else None
if order is None:
    t=np.fromfile('/home/user/diwania-plus/worker/src/ctx/top.bin',dtype=np.uint16);S0,K0=int(t[0]),int(t[1]);order=[old[t[2+s*K0]] for s in range(S0)]
    json.dump(order,open('secret_order.json','w'),ensure_ascii=False)
sec=[idx[key(w)] for w in order]
print('vocab',N,'secrets',len(sec))
def bg(w): w='^'+w+'$'; return set(w[k:k+2] for k in range(len(w)-1))
BG=[bg(k) for k in K_]
K=1500
top=np.zeros((len(sec),K),dtype=np.uint16)
RANKS=list(range(1,301))+list(range(310,1501,10))+list(range(1600,N+1,100))
thr=np.zeros((len(sec),len(RANKS)),dtype=np.float16)
for s,i in enumerate(sec):
    sims=E@E[i]; o=np.argsort(-sims); head=list(o[:6000]); b=BG[i]
    bonus={}
    for pos,w in enumerate(L.get(D[i],[])):
        j=idx.get(key(w))
        if j is not None: bonus[j]=0.30*(1-pos/50)
    for j in bonus:
        if j not in head[:6000]: head.append(j)
    head=[j for j in head if j!=i]
    sc=np.array([sims[j]-0.15*2*len(b&BG[j])/(len(b)+len(BG[j]))+bonus.get(j,0) for j in head])
    hs=np.argsort(-sc); head=[head[k] for k in hs]; sc=sc[hs]
    top[s,0]=i; top[s,1:]=head[:K-1]
    hset=set(head)
    full=[60000.0]+list(sc)+[float(sims[j]) for j in o[6000:] if j not in hset and j!=i]
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
for s in range(3):
    print(D[sec[s]],'→',' '.join(D[j] for j in top[s,1:25]))
