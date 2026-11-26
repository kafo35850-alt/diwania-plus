import json,numpy as np,subprocess,os,time
K=open('key').read().strip()
import sys
V=json.load(open('vocab_all.json'))['disp']
ONLY=sys.argv[1]
CFG={'qwenI':('@cf/qwen/qwen3-embedding-0.6b','Instruct: Given an Arabic word, retrieve words related in meaning\nQuery: {}'),'bge':('@cf/baai/bge-m3','{}'),'gemma':('@cf/google/embeddinggemma-300m','{}')}
B=400
for name,(m,t) in CFG.items():
    if name!=ONLY: continue
    os.makedirs('e3/'+name,exist_ok=True)
    for i in range(0,len(V),B):
        f=f'e3/{name}/{i:06d}.npy'
        if os.path.exists(f): continue
        v=None
        for k in range(6):
            r=subprocess.run(['curl','-s','--max-time','150','-X','POST','https://diwaniyaplus.com/api/tmp-embed-'+K,'-H','content-type: application/json','-d',json.dumps({'model':m,'words':[t.format(w) for w in V[i:i+B]]},ensure_ascii=False)],capture_output=True,text=True)
            try:
                v=np.array(json.loads(r.stdout),dtype=np.float32); assert v.shape[0]==len(V[i:i+B]); break
            except Exception: print('retry',name,i,r.stdout[:120],flush=True); v=None; time.sleep(5*(k+1))
        if v is None: print('FAIL',name,i,flush=True); continue
        v/=np.linalg.norm(v,axis=1,keepdims=True); np.save(f,v.astype(np.float16)); print('ok',name,i,flush=True)
print('DONE',flush=True)
